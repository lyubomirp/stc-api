import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as csv from '@fast-csv/parse';
import { LastUpdateService } from './lastUpdate.service';
import { ImportService } from './import.service';

const LAST_UPDATE_FILE = 'Last_update.csv';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly lastUpdateService: LastUpdateService,
    private readonly importService: ImportService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleNightlyRefresh() {
    try {
      const remote = await this.fetchRemoteLastUpdate();

      if (!remote) {
        this.logger.warn(
          `${LAST_UPDATE_FILE} contained no last_update value`,
        );
        return;
      }

      const local = await this.lastUpdateService.findLatest();

      if (local && new Date(remote) <= new Date(local.lastUpdate)) {
        this.logger.log(`Already at latest update (${remote})`);
        return;
      }

      this.logger.log(
        `Update available: local=${local?.lastUpdate ?? 'none'} ` +
          `remote=${remote}`,
      );

      // last_update is refreshed from the downloaded file as part of
      // the import, so a rollback leaves it stale and we retry.
      const reports = await this.importService.refreshFromRemote();
      const rows = reports.reduce((a, r) => a + r.imported, 0);

      this.logger.log(`Refresh complete: ${rows} rows`);
    } catch (err) {
      // An uncaught throw here takes the process down.
      this.logger.error(
        `Nightly refresh failed: ${err.message}`,
        err.stack,
      );
    }
  }

  private async fetchRemoteLastUpdate(): Promise<string | null> {
    const baseUrl = this.configService.get<string>('api.url');

    if (!baseUrl) {
      throw new Error('api.url is not configured');
    }

    const response = await firstValueFrom(
      this.httpService.get<string>(`${baseUrl}/${LAST_UPDATE_FILE}`, {
        responseType: 'text',
      }),
    );

    const rows = await this.parseCsv(response.data);

    return rows[0]?.['last_update'] ?? null;
  }

  private parseCsv(body: string): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      const rows: Record<string, string>[] = [];

      csv
        .parseString(body, {
          delimiter: '|',
          headers: true,
          ignoreEmpty: true,
        })
        .on('error', reject)
        .on('data', (row) => rows.push(row))
        .on('end', () => resolve(rows));
    });
  }
}

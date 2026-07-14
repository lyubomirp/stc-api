import { Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DataSource, EntityManager } from 'typeorm';
import { firstValueFrom } from 'rxjs';
import * as csv from '@fast-csv/parse';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  IMPORT_MANIFEST,
  ImportSpec,
} from '../config/importManifest';
import { IBaseServiceHost } from './base.service';

export interface ImportReport {
  file: string;
  parsed: number;
  duplicates: number;
  skipped: number;
  nulledRefs: number;
  imported: number;
  links?: number;
}

interface ParsedFile {
  spec: ImportSpec;
  rows: any[];
  duplicates: number;
}

interface JunctionRows {
  table: string;
  rows: Record<string, any>[];
}

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);
  private refreshing: Promise<ImportReport[]> | null = null;

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  // Concurrent refreshes fight over the same tables: one deletes rows
  // the other has already referenced. Callers join the run in flight.
  async refreshFromRemote(): Promise<ImportReport[]> {
    if (this.refreshing) {
      this.logger.warn('Refresh already running; joining it');
      return this.refreshing;
    }

    this.refreshing = this.runRefresh();

    try {
      return await this.refreshing;
    } finally {
      this.refreshing = null;
    }
  }

  private async runRefresh(): Promise<ImportReport[]> {
    const dir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), 'wahapedia-'),
    );

    try {
      await this.download(dir);
      return await this.importAll(dir);
    } finally {
      await fs.promises.rm(dir, { recursive: true, force: true });
    }
  }

  private async download(dir: string): Promise<void> {
    const baseUrl = this.configService.get<string>('api.url');

    if (!baseUrl) {
      throw new Error('api.url is not configured');
    }

    for (const spec of IMPORT_MANIFEST) {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/${spec.file}`, {
          responseType: 'arraybuffer',
        }),
      );

      await fs.promises.writeFile(
        path.join(dir, spec.file),
        Buffer.from(response.data),
      );
    }

    this.logger.log(
      `Downloaded ${IMPORT_MANIFEST.length} files to ${dir}`,
    );
  }

  async importAll(dir: string): Promise<ImportReport[]> {
    const parsed: ParsedFile[] = [];

    for (const spec of IMPORT_MANIFEST) {
      parsed.push(await this.parseFile(dir, spec));
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Children first, or the foreign keys block the delete.
      for (const { spec } of [...parsed].reverse()) {
        await this.serviceFor(spec).deleteAll(queryRunner.manager);
      }

      const reports: ImportReport[] = [];
      for (const file of parsed) {
        reports.push(
          await this.insertFile(file, queryRunner.manager),
        );
      }

      await queryRunner.commitTransaction();
      this.logger.log('Import committed');

      return reports;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(
        `Import rolled back: ${err.message}`,
        err.stack,
      );
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  private serviceFor(spec: ImportSpec): IBaseServiceHost<any> {
    return this.moduleRef.get<IBaseServiceHost<any>>(spec.service, {
      strict: false,
    });
  }

  private async parseFile(
    dir: string,
    spec: ImportSpec,
  ): Promise<ParsedFile> {
    const path = `${dir}/${spec.file}`;

    if (!fs.existsSync(path)) {
      throw new Error(`Missing import file: ${path}`);
    }

    const rows = await this.readCsv(path, spec);
    const deduped = this.dedupe(rows);

    return {
      spec,
      rows: deduped,
      duplicates: rows.length - deduped.length,
    };
  }

  private async insertFile(
    { spec, rows, duplicates }: ParsedFile,
    manager: EntityManager,
  ): Promise<ImportReport> {
    const service = this.serviceFor(spec);

    const { kept, skipped, nulledRefs } = await this.resolveRelations(
      service,
      rows,
      spec,
      manager,
    );

    const { entities, links } = await this.collapse(
      service,
      kept,
      spec,
      manager,
    );

    await service.createMany(entities, manager);
    // Links reference the rows just inserted, so they must come after.
    await this.insertLinks(spec, links, manager);

    const report: ImportReport = {
      file: spec.file,
      parsed: rows.length + duplicates,
      duplicates,
      skipped,
      nulledRefs,
      imported: entities.length,
      ...(spec.collapse ? { links: links.rows.length } : {}),
    };

    this.logger.log(
      `${spec.file}: imported=${entities.length}` +
        (spec.collapse ? ` links=${links.rows.length}` : '') +
        (duplicates ? ` duplicates=${duplicates}` : '') +
        (skipped ? ` skipped=${skipped}` : '') +
        (nulledRefs ? ` nulledRefs=${nulledRefs}` : ''),
    );

    return report;
  }

  private async insertLinks(
    spec: ImportSpec,
    links: JunctionRows,
    manager: EntityManager,
  ): Promise<void> {
    if (!spec.collapse || !links.rows.length) {
      return;
    }

    for (let i = 0; i < links.rows.length; i += 500) {
      await manager
        .createQueryBuilder()
        .insert()
        .into(links.table)
        .values(links.rows.slice(i, i + 500))
        .execute();
    }
  }

  private async collapse(
    service: IBaseServiceHost<any>,
    rows: any[],
    spec: ImportSpec,
    manager: EntityManager,
  ): Promise<{ entities: any[]; links: JunctionRows }> {
    if (!spec.collapse) {
      return { entities: rows, links: { table: '', rows: [] } };
    }

    const { by, from, into } = spec.collapse;
    const relation =
      service.repository.metadata.findRelationWithPropertyPath(into);

    if (!relation?.junctionEntityMetadata) {
      throw new Error(
        `${spec.file}: '${into}' is not a join-table relation`,
      );
    }

    const junction = relation.junctionEntityMetadata.tableName;
    const ownerColumn = relation.joinColumns[0].databaseName;
    const targetColumn = relation.inverseJoinColumns[0].databaseName;

    const targetMeta = relation.inverseEntityMetadata;
    const targetKey = targetMeta.primaryColumns[0].propertyName;
    const validIds = new Set(
      (
        await manager
          .getRepository(targetMeta.target)
          .find({ select: { [targetKey]: true } })
      ).map((t) => t[targetKey]),
    );

    const entities = new Map<any, any>();
    const links = new Map<string, any>();

    for (const row of rows) {
      const { [from]: targetId, ...entity } = row;

      if (!entities.has(entity[by])) {
        entities.set(entity[by], entity);
      }

      if (targetId === null || targetId === undefined) continue;

      if (!validIds.has(targetId)) {
        this.logger.warn(
          `${spec.file}: ${from}=${targetId} not present in ` +
            `${targetMeta.tableName} - dropping link`,
        );
        continue;
      }

      links.set(`${entity[by]}:${targetId}`, {
        [ownerColumn]: entity[by],
        [targetColumn]: targetId,
      });
    }

    return {
      entities: [...entities.values()],
      links: { table: junction, rows: [...links.values()] },
    };
  }

  private readCsv(path: string, spec: ImportSpec): Promise<any[]> {
    const content = this.readRepaired(path, spec);

    return new Promise((resolve, reject) => {
      const res: any[] = [];
      let checked = false;

      csv
        .parseString(content, {
          delimiter: '|',
          headers: true,
          ignoreEmpty: true,
        })
        .on('error', reject)
        .on('data', (row) => {
          if (!checked) {
            checked = true;
            try {
              this.assertHeaders(Object.keys(row), spec);
            } catch (err) {
              return reject(err);
            }
          }

          res.push(this.mapRow(row, spec));
        })
        .on('end', () => resolve(res));
    });
  }

  // The export is unquoted, so a newline inside a field splits a record
  // across lines. A record is complete once it has as many delimiters
  // as the header.
  private readRepaired(path: string, spec: ImportSpec): string {
    let raw = fs.readFileSync(path, 'utf8');

    if (raw.charCodeAt(0) === 0xfeff) {
      raw = raw.slice(1);
    }

    const lines = raw.split(/\r?\n/);
    const header = lines[0];
    const expected = this.countDelimiters(header);
    const out = [header];

    let buffer: string | null = null;
    let repaired = 0;

    for (let i = 1; i < lines.length; i++) {
      if (buffer === null && !lines[i].trim()) continue;

      buffer = buffer === null ? lines[i] : `${buffer} ${lines[i]}`;

      if (this.countDelimiters(buffer) >= expected) {
        if (buffer !== lines[i]) {
          repaired++;
          this.logger.warn(
            `${spec.file}: rejoined record split across lines ` +
              `near line ${i + 1}`,
          );
        }
        out.push(buffer);
        buffer = null;
      }
    }

    if (buffer?.trim()) {
      out.push(buffer);
    }

    if (repaired) {
      this.logger.warn(
        `${spec.file}: repaired ${repaired} split record(s)`,
      );
    }

    return out.join('\n');
  }

  private countDelimiters(line: string): number {
    return (line.match(/\|/g) || []).length;
  }

  private assertHeaders(headers: string[], spec: ImportSpec) {
    const present = headers.filter((h) => h !== '');
    const expected = Object.keys(spec.columns);

    const unknown = present.filter((h) => !expected.includes(h));
    const missing = expected.filter((h) => !present.includes(h));

    if (unknown.length || missing.length) {
      throw new Error(
        `${spec.file} header mismatch. ` +
          (unknown.length
            ? `Unknown column(s): ${unknown.join(', ')}. `
            : '') +
          (missing.length
            ? `Missing column(s): ${missing.join(', ')}. `
            : '') +
          `Update IMPORT_MANIFEST to match the upstream export.`,
      );
    }
  }

  private mapRow(row: Record<string, string>, spec: ImportSpec) {
    const mapped: Record<string, any> = {};

    for (const [header, prop] of Object.entries(spec.columns)) {
      const value = row[header];

      if (value === undefined || value === '') {
        mapped[prop] = null;
        continue;
      }

      mapped[prop] = value.replaceAll(/<[^>]*>/g, '\n');
    }

    return mapped;
  }

  private dedupe(rows: any[]): any[] {
    const seen = new Set<string>();

    return rows.filter((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private async resolveRelations(
    service: IBaseServiceHost<any>,
    rows: any[],
    spec: ImportSpec,
    manager: EntityManager,
  ): Promise<{ kept: any[]; skipped: number; nulledRefs: number }> {
    const relations = service.repository.metadata.relations.filter(
      (relation) =>
        relation.isManyToOne &&
        Object.values(spec.columns).includes(relation.propertyName),
    );

    if (!relations.length) {
      return { kept: rows, skipped: 0, nulledRefs: 0 };
    }

    const validIds = new Map<string, Set<any>>();

    for (const relation of relations) {
      const parentMeta = relation.inverseEntityMetadata;
      const parentKey = parentMeta.primaryColumns[0].propertyName;

      // Read through the transaction: the parent was inserted by an
      // earlier step of this same import.
      const parents = await manager
        .getRepository(parentMeta.target)
        .find({ select: { [parentKey]: true } });

      validIds.set(
        relation.propertyName,
        new Set(parents.map((p) => p[parentKey])),
      );
    }

    const kept: any[] = [];
    let skipped = 0;
    let nulledRefs = 0;
    const reported = new Set<string>();

    for (const row of rows) {
      let drop = false;

      for (const relation of relations) {
        const prop = relation.propertyName;
        const value = row[prop];

        if (value === null || value === undefined) continue;
        if (validIds.get(prop).has(value)) continue;

        const key = `${prop}:${value}`;
        if (!reported.has(key)) {
          reported.add(key);
          this.logger.warn(
            `${spec.file}: ${prop}=${value} not present in ` +
              `${relation.inverseEntityMetadata.tableName}` +
              (relation.isNullable
                ? ' - nulling ref'
                : ' - skipping row'),
          );
        }

        if (relation.isNullable) {
          row[prop] = null;
          nulledRefs++;
        } else {
          drop = true;
        }
      }

      if (drop) skipped++;
      else kept.push(row);
    }

    return { kept, skipped, nulledRefs };
  }
}

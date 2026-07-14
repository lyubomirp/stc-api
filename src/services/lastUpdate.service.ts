import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { LastUpdate } from '../entities/lastUpdate';

@Injectable()
export class LastUpdateService extends BaseService(LastUpdate) {
  async findLatest(): Promise<LastUpdate | null> {
    const [latest] = await this.repository.find({
      order: { id: 'DESC' },
      take: 1,
    });

    return latest ?? null;
  }
}

import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { DatasheetsLeader } from '../entities/datasheetsLeader';
import { Datasheets } from '../entities/datasheets';

@Injectable()
export class DatasheetsLeaderService extends BaseService(
  DatasheetsLeader,
) {
  async findAllById(
    datasheet: Datasheets,
  ): Promise<DatasheetsLeader[]> {
    return this.repository.find({
      where: { attached: { id: datasheet.id } },
      relations: { leader: true },
    });
  }
}

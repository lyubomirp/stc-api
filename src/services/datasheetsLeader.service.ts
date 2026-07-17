import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { DatasheetsLeader } from '../entities/datasheetsLeader';
import { Datasheets } from '../entities/datasheets';

@Injectable()
export class DatasheetsLeaderService extends BaseService(
  DatasheetsLeader,
) {
  // Who may lead this unit.
  async findAllById(
    datasheet: Datasheets,
  ): Promise<DatasheetsLeader[]> {
    return this.repository.find({
      where: { attached: { id: datasheet.id } },
      relations: { leader: true },
    });
  }

  // The reverse. Separate because Leader.tsx depends on findAllById's direction.
  async findLeadableBy(
    datasheet: Datasheets,
  ): Promise<DatasheetsLeader[]> {
    return this.repository.find({
      where: { leader: { id: datasheet.id } },
      relations: { attached: true },
    });
  }
}

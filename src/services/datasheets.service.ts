import { Injectable } from '@nestjs/common';
import { FindOptionsRelations } from 'typeorm';
import { BaseService } from './base.service';
import { Datasheets } from '../entities/datasheets';
import { Factions } from '../entities/factions';

@Injectable()
export class DatasheetsService extends BaseService(Datasheets) {
  // The list view only needs enough to render and pick an entry;
  // the heavy prose lives on /datasheets/single/:id.
  async findByFaction(faction: Factions) {
    return this.repository.find({
      where: { faction: { id: faction.id } },
      select: { id: true, name: true, role: true },
    });
  }

  async findOne(
    id: string,
    relations?: FindOptionsRelations<Datasheets>,
  ) {
    return await this.repository.findOne({
      where: { id },
      relations,
    });
  }
}

import { Injectable } from '@nestjs/common';
import { FindOptionsRelations } from 'typeorm';
import { BaseService } from './base.service';
import { Datasheets } from '../entities/datasheets';
import { Factions } from '../entities/factions';

@Injectable()
export class DatasheetsService extends BaseService(Datasheets) {
  async findByFaction(faction: Factions) {
    return await this.repository.findBy({
      faction: { id: faction.id },
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

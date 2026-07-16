import { Injectable } from '@nestjs/common';
import { FindOptionsRelations } from 'typeorm';
import { BaseService } from './base.service';
import { Datasheets } from '../entities/datasheets';
import { DatasheetsKeywords } from '../entities/datasheetsKeywords';
import { Factions } from '../entities/factions';
import { CostTier, costTiers } from '../utils/costs';

export interface DatasheetListItem {
  id: string;
  name: string;
  role: string | null;
  costs: CostTier[];
}

@Injectable()
export class DatasheetsService extends BaseService(Datasheets) {
  // List projection; the heavy prose stays on /datasheets/single/:id.
  //
  // `subfactionKeywords` are the OTHER sub-factions: a chapter fields its own
  // units plus every generic one, so this excludes units owned by someone else
  // rather than keeping only those owned by this one.
  async findByFaction(
    faction: Factions,
    subfactionKeywords: string[] = [],
  ): Promise<DatasheetListItem[]> {
    const query = this.repository
      .createQueryBuilder('datasheet')
      .select([
        'datasheet.id',
        'datasheet.name',
        'datasheet.role',
        // The client sends `line` back to say which option it picked.
        'cost.line',
        'cost.description',
        'cost.cost',
      ])
      .leftJoin('datasheet.datasheetModelsCost', 'cost')
      .where('datasheet.factionId = :factionId', {
        factionId: faction.id,
      })
      .orderBy('datasheet.name', 'ASC');

    if (subfactionKeywords.length) {
      query.andWhere(
        `NOT EXISTS ${query
          .subQuery()
          .select('1')
          .from(DatasheetsKeywords, 'keyword')
          .where('keyword.datasheetId = datasheet.id')
          .andWhere('keyword.keyword IN (:...excluded)')
          .getQuery()}`,
        { excluded: subfactionKeywords },
      );
    }

    const rows = await query.getMany();

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      costs: costTiers(row.datasheetModelsCost ?? []),
    }));
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

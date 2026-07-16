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
  /** Points tiers, cheapest first: [{ models: 5, pts: 85 }, ...]. */
  costs: CostTier[];
}

@Injectable()
export class DatasheetsService extends BaseService(Datasheets) {
  /**
   * The list view: enough to render the arsenal and pick an entry. The heavy
   * prose stays on /datasheets/single/:id.
   *
   * Costs ride along rather than being fetched per unit -- the roster needs a
   * price against every row, and 298 extra round trips to draw one list is
   * worse than the few KB. They are parsed by utils/costs, the same code that
   * prices a saved roster.
   *
   * `subfactionKeywords` are the *other* sub-factions of this faction. A
   * chapter fields its own units **plus every generic one**: Azrael is Dark
   * Angels alone, but Intercessors belong to anybody. SM is 298 datasheets and
   * only 142 are chapter-locked, so keeping just the keyworded ones would leave
   * a chapter with nothing but its characters. Hence "exclude units owned by
   * someone else" rather than "keep units owned by me".
   */
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
        // `line` is the tier's key, not decoration: the client sends it back to
        // say which option it picked.
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

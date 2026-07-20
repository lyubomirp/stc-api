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
  // Omitted rather than false: emitting `false` on all 298 SM datasheets cost
  // 18% of the list.
  hasWargearChoices?: true;
  isLeader?: true;
  // In ANY detachment; the client filters by the selected one.
  hasEnhancements?: true;
}

// Mirrors isExclusive() in the FE's LoadoutModal and must keep matching.
const EXCLUSIVE_GROUP = '$.**?(@.kind == "group" && @.max == 1)';

export interface DatasheetSearchHit {
  id: string;
  name: string;
  role: string | null;
  factionId: string;
  factionName: string;
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
    const [withChoices, leaders, enhanced] = await Promise.all([
      this.findIdsWithWargearChoices(faction.id),
      this.findIdsMatching(
        faction.id,
        'datasheets_leader',
        '"leaderId"',
      ),
      this.findIdsMatching(
        faction.id,
        'datasheets_enhancements',
        '"datasheetId"',
      ),
    ]);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      role: row.role,
      costs: costTiers(row.datasheetModelsCost ?? []),
      ...(withChoices.has(row.id)
        ? { hasWargearChoices: true as const }
        : {}),
      ...(leaders.has(row.id) ? { isLeader: true as const } : {}),
      ...(enhanced.has(row.id)
        ? { hasEnhancements: true as const }
        : {}),
    }));
  }

  // `table` and `column` are call-site literals, never user input.
  private async findIdsMatching(
    factionId: string,
    table: string,
    column: string,
  ): Promise<Set<string>> {
    const rows = await this.repository
      .createQueryBuilder('datasheet')
      .select('datasheet.id', 'id')
      .where('datasheet.factionId = :factionId', { factionId })
      .andWhere(
        `EXISTS (SELECT 1 FROM ${table} t WHERE t.${column} = datasheet.id)`,
      )
      .getRawMany<{ id: string }>();

    return new Set(rows.map((r) => r.id));
  }

  // Not an addSelect: the list joins cost rows, so getRawAndEntities would need
  // de-multiplying for one boolean.
  private async findIdsWithWargearChoices(
    factionId: string,
  ): Promise<Set<string>> {
    const rows = await this.repository
      .createQueryBuilder('datasheet')
      .select('datasheet.id', 'id')
      .where('datasheet.factionId = :factionId', { factionId })
      .andWhere(
        `jsonb_path_exists(datasheet."wargearOptions", :path::jsonpath)`,
        { path: EXCLUSIVE_GROUP },
      )
      .getRawMany<{ id: string }>();

    return new Set(rows.map((r) => r.id));
  }

  // Name search across every faction, paginated. Excludes the lone `virtual`
  // template row (junk, not a real unit). LIKE metacharacters in the query are
  // escaped so a typed `%` matches literally.
  async search(
    q: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: DatasheetSearchHit[]; total: number }> {
    const like = `%${q.replace(/[\\%_]/g, '\\$&')}%`;

    const base = this.repository
      .createQueryBuilder('d')
      .innerJoin('d.faction', 'f')
      .where('d.virtual <> :virtual', { virtual: 'true' })
      .andWhere("d.name ILIKE :like ESCAPE '\\'", { like });

    const total = await base.clone().getCount();

    const items = await base
      .clone()
      .select([
        'd.id AS id',
        'd.name AS name',
        'd.role AS role',
        'f.id AS "factionId"',
        'f.name AS "factionName"',
      ])
      .orderBy('d.name', 'ASC')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .getRawMany<DatasheetSearchHit>();

    return { items, total };
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

import { Injectable } from '@nestjs/common';
import { Factions } from '../entities/factions';
import { Abilities } from '../entities/abilities';
import { Detachments } from '../entities/detachments';
import { Datasheets } from '../entities/datasheets';
import { BaseService } from './base.service';

export interface Subfaction {
  keyword: string;
  datasheets: number;
}

export interface FactionKeyword {
  keyword: string;
  isFactionKeyword: boolean;
  units: number;
}

@Injectable()
export class FactionsService extends BaseService(Factions) {
  async findOne(id: string): Promise<Factions | null> {
    return this.repository.findOne({ where: { id } });
  }

  /** A faction's army rules. Wahapedia lists every one of these. */
  async findAbilities(factionId: string): Promise<Abilities[]> {
    return this.dataSource.getRepository(Abilities).find({
      where: { factions: { id: factionId } },
      order: { name: 'ASC' },
    });
  }

  /** Names only: the contents are fetched per detachment on demand. */
  async findDetachments(factionId: string): Promise<Detachments[]> {
    return this.dataSource.getRepository(Detachments).find({
      where: { faction: { id: factionId } },
      select: { id: true, name: true, type: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Sub-factions are faction keywords on the faction's own datasheets,
   * minus two kinds of noise: the parent keyword, which is on every
   * datasheet (Adeptus Astartes for SM), and keywords that are top-level
   * factions in their own right (Chaos Space Marines lists Death Guard).
   */
  async findSubfactions(factionId: string): Promise<Subfaction[]> {
    return this.dataSource.query(
      `
      SELECT k.keyword, count(DISTINCT k."datasheetId")::int AS datasheets
      FROM datasheets_keywords k
      JOIN datasheets d ON d.id = k."datasheetId"
      WHERE d."factionId" = $1
        AND k."isFactionKeyword" = 'true'
        AND k.keyword <> ''
        AND k.keyword NOT IN (SELECT name FROM factions)
      GROUP BY k.keyword
      HAVING count(DISTINCT k."datasheetId") <
             (SELECT count(*) FROM datasheets WHERE "factionId" = $1)
      ORDER BY count(DISTINCT k."datasheetId") DESC, k.keyword ASC
      `,
      [factionId],
    );
  }

  async findKeywords(factionId: string): Promise<FactionKeyword[]> {
    return this.dataSource.query(
      `
      SELECT k.keyword,
             bool_or(k."isFactionKeyword" = 'true') AS "isFactionKeyword",
             count(DISTINCT k."datasheetId")::int AS units
      FROM datasheets_keywords k
      JOIN datasheets d ON d.id = k."datasheetId"
      WHERE d."factionId" = $1 AND k.keyword <> ''
      GROUP BY k.keyword
      ORDER BY count(DISTINCT k."datasheetId") DESC, k.keyword ASC
      `,
      [factionId],
    );
  }

  /** Which of this faction's units carry a given keyword. */
  async findDatasheetsByKeyword(
    factionId: string,
    keyword: string,
  ): Promise<Datasheets[]> {
    return this.dataSource.query(
      `
      SELECT DISTINCT d.id, d.name, d.role
      FROM datasheets d
      JOIN datasheets_keywords k ON k."datasheetId" = d.id
      WHERE d."factionId" = $1 AND lower(k.keyword) = lower($2)
      ORDER BY d.name ASC
      `,
      [factionId, keyword],
    );
  }
}

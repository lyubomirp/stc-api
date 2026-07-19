import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datasheets } from '../entities/datasheets';
import { CostTier, allyCostTiers } from '../utils/costs';
import {
  ALLIED_FAMILIES,
  AlliedCaps,
  AlliedFamily,
} from '../config/alliedFamilies';

export interface AlliedUnit {
  id: string;
  name: string;
  role: string | null;
  // Which cap it counts against; null = a dependent transport, or any unit in a
  // points-budget family (those have no per-category caps).
  category: string | null;
  costs: CostTier[];
}

export interface AlliedFamilyPayload {
  id: string;
  name: string;
  sourceFactionId: string;
  categories: string[];
  caps: AlliedCaps;
  units: AlliedUnit[];
}

@Injectable()
export class AlliedForcesService {
  constructor(
    @InjectRepository(Datasheets)
    private readonly datasheets: Repository<Datasheets>,
  ) {}

  // The families a primary faction may draw allies from. Empty when it is
  // ineligible (not pure-Imperium, or it IS the source faction).
  async forFaction(
    factionId: string,
  ): Promise<AlliedFamilyPayload[]> {
    const out: AlliedFamilyPayload[] = [];

    for (const family of ALLIED_FAMILIES) {
      if (factionId === family.sourceFactionId) continue;
      if (!(await this.isEligible(factionId, family))) continue;
      out.push(await this.buildFamily(family));
    }

    return out;
  }

  // Eligible when every real datasheet carries an eligibility keyword. `virtual`
  // rows are excluded -- the sole one (SM's Example Wargear template) has no
  // Imperium keyword and would fail Space Marines by one. See NOTES.
  private async isEligible(
    factionId: string,
    family: AlliedFamily,
  ): Promise<boolean> {
    const counts = await this.datasheets
      .createQueryBuilder('d')
      .select('count(*)', 'total')
      .addSelect(
        `count(*) FILTER (WHERE EXISTS (SELECT 1 FROM datasheets_keywords k ` +
          `WHERE k."datasheetId" = d.id AND k.keyword IN (:...kws)))`,
        'matching',
      )
      .where('d.factionId = :factionId', { factionId })
      .andWhere(`d.virtual IS DISTINCT FROM 'true'`)
      .setParameter('kws', family.eligibilityKeywords)
      .getRawOne<{ total: string; matching: string }>();

    return (
      counts != null &&
      counts.total !== '0' &&
      counts.total === counts.matching
    );
  }

  private async buildFamily(
    family: AlliedFamily,
  ): Promise<AlliedFamilyPayload> {
    const rows = await this.datasheets
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.datasheetModelsCost', 'cost')
      .leftJoinAndSelect('d.datasheetKeywords', 'kw')
      .where('d.factionId = :factionId', {
        factionId: family.sourceFactionId,
      })
      .getMany();

    const units = rows
      .map((d) => ({
        id: d.id,
        name: d.name,
        role: d.role,
        category: this.categoryOf(d, family),
        costs: allyCostTiers(d.datasheetModelsCost ?? []),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return {
      id: family.id,
      name: family.name,
      sourceFactionId: family.sourceFactionId,
      categories: family.categories.map((c) => c.label),
      caps: family.caps,
      units,
    };
  }

  private categoryOf(
    datasheet: Datasheets,
    family: AlliedFamily,
  ): string | null {
    const keywords = new Set(
      (datasheet.datasheetKeywords ?? []).map((k) => k.keyword),
    );

    return (
      family.categories.find((c) => keywords.has(c.keyword))?.label ??
      null
    );
  }
}

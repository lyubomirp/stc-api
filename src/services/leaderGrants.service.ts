import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datasheets } from '../entities/datasheets';
import { LEADER_GRANTS, GrantTarget } from '../config/leaderGrants';

@Injectable()
export class LeaderGrantsService {
  constructor(
    @InjectRepository(Datasheets)
    private readonly datasheets: Repository<Datasheets>,
  ) {}

  hasGrant(enhancementName: string): boolean {
    return enhancementName in LEADER_GRANTS;
  }

  // Datasheet ids the enhancement lets its bearer join, scoped to the
  // enhancement's own faction so a shared unit name resolves to the right copy.
  async resolve(
    enhancementName: string,
    factionId: string,
  ): Promise<string[]> {
    const spec = LEADER_GRANTS[enhancementName];
    if (!spec) return [];

    const rows = await this.query(spec, factionId).getRawMany<{
      id: string;
    }>();

    return rows.map((r) => r.id);
  }

  private query(spec: GrantTarget, factionId: string) {
    const qb = this.datasheets
      .createQueryBuilder('d')
      .select('d.id', 'id')
      .where('d.factionId = :factionId', { factionId });

    if ('names' in spec) {
      return qb.andWhere('lower(d.name) IN (:...names)', {
        names: spec.names.map((n) => n.toLowerCase()),
      });
    }

    spec.keywords.forEach((keyword, i) => {
      qb.andWhere(
        `EXISTS (SELECT 1 FROM datasheets_keywords k${i} WHERE ` +
          `k${i}."datasheetId" = d.id AND upper(k${i}.keyword) = upper(:kw${i}))`,
        { [`kw${i}`]: keyword },
      );
    });

    if (spec.exclude) {
      qb.andWhere(
        `NOT EXISTS (SELECT 1 FROM datasheets_keywords kx WHERE ` +
          `kx."datasheetId" = d.id AND upper(kx.keyword) = upper(:exclude))`,
        { exclude: spec.exclude },
      );
    }

    return qb;
  }
}

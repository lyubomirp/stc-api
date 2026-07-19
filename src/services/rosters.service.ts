import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, LessThan, Not, Repository } from 'typeorm';
import { Rosters } from '../entities/rosters';
import { RosterUnits } from '../entities/rosterUnits';
import { Datasheets } from '../entities/datasheets';
import { DatasheetsModelsCost } from '../entities/datasheetsModelsCost';
import { DatasheetsLeader } from '../entities/datasheetsLeader';
import { DatasheetsEnhancements } from '../entities/datasheetsEnhancements';
import { LeaderGrantsService } from './leaderGrants.service';
import {
  allyCostTiers,
  costTiers,
  enhancementCost,
  priceAt,
} from '../utils/costs';

interface EnhancementSnapshot {
  id: string;
  name: string;
  pts: number;
}

// `path` addresses a group in datasheets.wargearOptions; `group` is its name at
// save time, so a regenerated tree can be detected rather than mis-rendered.
export interface WargearPick {
  path: string;
  group: string;
  chosen: string;
}

export interface RosterUnitInput {
  datasheetId: string;
  costLine?: string;
  // Legacy: only used when costLine is absent.
  modelCount?: number;
  wargear?: WargearPick[] | null;
  // An index into this same array, not a row id: the target row does not exist
  // until after the insert, and a datasheet id cannot tell two identical squads
  // apart.
  attachedToIndex?: number | null;
  enhancementId?: string | null;
}

export interface CreateRosterInput {
  name: string;
  factionId: string;
  subfactionKeyword?: string | null;
  detachmentId?: string | null;
  detachmentName?: string | null;
  battleSize: number;
  units: RosterUnitInput[];
  warlordDatasheetId?: string | null;
}

const BATTLE_SIZES = [1000, 2000, 3000];

// RosterStep sums these two the same way; if they drift the meter lies.
const totalPoints = (units: RosterUnits[]): number =>
  units.reduce(
    (sum, u) => sum + (u.pointsAtSave ?? 0) + (u.enhancementPts ?? 0),
    0,
  );

// Shape only -- nothing queries into the jsonb, and 10e wargear is free.
const cleanWargear = (
  datasheetId: string,
  picks?: WargearPick[] | null,
): WargearPick[] | null => {
  if (picks == null) return null;

  if (!Array.isArray(picks)) {
    throw new BadRequestException(
      `datasheet ${datasheetId}: wargear must be an array`,
    );
  }

  if (!picks.length) return null;

  return picks.map((p) => {
    if (
      typeof p?.path !== 'string' ||
      typeof p?.group !== 'string' ||
      typeof p?.chosen !== 'string'
    ) {
      throw new BadRequestException(
        `datasheet ${datasheetId}: each wargear pick needs path, group and chosen`,
      );
    }

    return { path: p.path, group: p.group, chosen: p.chosen };
  });
};

@Injectable()
export class RostersService {
  constructor(
    @InjectRepository(Rosters)
    private readonly rosters: Repository<Rosters>,
    @InjectRepository(Datasheets)
    private readonly datasheets: Repository<Datasheets>,
    @InjectRepository(DatasheetsModelsCost)
    private readonly costs: Repository<DatasheetsModelsCost>,
    @InjectRepository(DatasheetsLeader)
    private readonly leaders: Repository<DatasheetsLeader>,
    @InjectRepository(DatasheetsEnhancements)
    private readonly datasheetEnhancements: Repository<DatasheetsEnhancements>,
    private readonly grants: LeaderGrantsService,
  ) {}

  // Datasheet ids each unit's enhancement lets it lead beyond datasheets_leader,
  // keyed by the unit's index.
  private async resolveGrants(
    input: CreateRosterInput,
    enhancements: Map<number, EnhancementSnapshot>,
  ): Promise<Map<number, Set<string>>> {
    const out = new Map<number, Set<string>>();

    await Promise.all(
      [...enhancements].map(async ([i, snap]) => {
        if (!input.factionId || !this.grants.hasGrant(snap.name))
          return;
        const ids = await this.grants.resolve(
          snap.name,
          input.factionId,
        );
        if (ids.length) out.set(i, new Set(ids));
      }),
    );

    return out;
  }

  // `datasheets_leader` says who MAY lead whom; attachedToId records who did.
  // An enhancement can widen that -- see resolveGrants.
  private async checkAttachments(
    units: RosterUnitInput[],
    granted: Map<number, Set<string>>,
  ): Promise<void> {
    const pairs = units
      .map((u, i) => ({ u, i }))
      .filter(({ u }) => u.attachedToIndex != null);

    if (!pairs.length) return;

    for (const { u, i } of pairs) {
      const target = u.attachedToIndex!;

      if (
        !Number.isInteger(target) ||
        target < 0 ||
        target >= units.length
      ) {
        throw new BadRequestException(
          `unit ${i}: attachedToIndex ${target} is out of range`,
        );
      }

      if (target === i) {
        throw new BadRequestException(
          `unit ${i} cannot attach to itself`,
        );
      }
    }

    const legal = await this.leaders.find({
      where: {
        leader: { id: In(pairs.map(({ u }) => u.datasheetId)) },
      },
      relations: { leader: true, attached: true },
    });

    const allowed = new Set(
      legal.map((l) => `${l.leader.id}->${l.attached.id}`),
    );

    for (const { u, i } of pairs) {
      const target = units[u.attachedToIndex!];
      const key = `${u.datasheetId}->${target.datasheetId}`;

      if (
        !allowed.has(key) &&
        !granted.get(i)?.has(target.datasheetId)
      ) {
        throw new BadRequestException(
          `unit ${i}: ${u.datasheetId} may not lead ${target.datasheetId}`,
        );
      }
    }
  }

  // `datasheets_enhancements` already encodes the bearer restriction ("Lord
  // Exultant model only") and excludes Epic Heroes, so nothing here reads prose.
  private async resolveEnhancements(
    input: CreateRosterInput,
  ): Promise<Map<number, EnhancementSnapshot>> {
    const wanted = (input.units ?? [])
      .map((u, i) => ({
        id: u.enhancementId,
        datasheetId: u.datasheetId,
        i,
      }))
      .filter(
        (x): x is { id: string; datasheetId: string; i: number } =>
          Boolean(x.id),
      );

    const out = new Map<number, EnhancementSnapshot>();

    if (!wanted.length) return out;

    // Each enhancement may be given to only one model in the army.
    const seen = new Set<string>();

    for (const { id, i } of wanted) {
      if (seen.has(id)) {
        throw new BadRequestException(
          `unit ${i}: enhancement ${id} is already taken by another unit`,
        );
      }

      seen.add(id);
    }

    const rows = await this.datasheetEnhancements.find({
      where: {
        enhancement: { id: In([...seen]) },
        datasheet: { id: In(wanted.map((w) => w.datasheetId)) },
      },
      relations: {
        enhancement: { detachmentRef: true },
        datasheet: true,
      },
    });

    for (const { id, datasheetId, i } of wanted) {
      const row = rows.find(
        (r) =>
          r.enhancement.id === id && r.datasheet.id === datasheetId,
      );

      if (!row) {
        throw new BadRequestException(
          `unit ${i}: ${datasheetId} may not take enhancement ${id}`,
        );
      }

      const owner = row.enhancement.detachmentRef?.id ?? null;

      if (
        owner &&
        input.detachmentId &&
        owner !== input.detachmentId
      ) {
        throw new BadRequestException(
          `unit ${i}: enhancement ${row.enhancement.name} belongs to ` +
            `${row.enhancement.detachment}, not this detachment`,
        );
      }

      const pts = enhancementCost(row.enhancement.cost);

      if (pts == null) {
        throw new BadRequestException(
          `unit ${i}: enhancement ${row.enhancement.name} has an unparseable ` +
            `cost "${row.enhancement.cost}"`,
        );
      }

      out.set(i, { id, name: row.enhancement.name, pts });
    }

    return out;
  }

  // Shared by create and update so a save behaves identically either way.
  private async build(
    input: CreateRosterInput,
  ): Promise<{ name: string; units: RosterUnits[] }> {
    const name = input.name?.trim();

    if (!name) {
      throw new BadRequestException('name is required');
    }

    if (!BATTLE_SIZES.includes(input.battleSize)) {
      throw new BadRequestException(
        `battleSize must be one of ${BATTLE_SIZES.join(', ')}`,
      );
    }

    const units = input.units ?? [];

    if (
      units.some(
        (u) =>
          !u.datasheetId ||
          (!u.costLine && !(u.modelCount && u.modelCount > 0)),
      )
    ) {
      throw new BadRequestException(
        'each unit needs a datasheetId and either a costLine or a modelCount',
      );
    }

    const enhancements = await this.resolveEnhancements(input);
    const granted = await this.resolveGrants(input, enhancements);
    await this.checkAttachments(units, granted);

    // Validated by lookup: the ids cannot carry a foreign key constraint.
    // Faction comes along so a unit from another faction (an ally) is priced
    // with its ally cost, not its own.
    const ids = [...new Set(units.map((u) => u.datasheetId))];
    const found = ids.length
      ? await this.datasheets.find({
          where: { id: In(ids) },
          relations: { faction: true },
          select: { id: true, name: true, faction: { id: true } },
        })
      : [];

    const byId = new Map(found.map((d) => [d.id, d]));
    const unknown = ids.filter((id) => !byId.has(id));

    if (unknown.length) {
      throw new BadRequestException(
        `unknown datasheet id(s): ${unknown.join(', ')}`,
      );
    }

    const costRows = ids.length
      ? await this.costs.find({
          where: { datasheet: { id: In(ids) } },
          relations: { datasheet: true },
        })
      : [];

    const rows = units.map((u, i) => {
      const unitRows = costRows.filter(
        (c) => c.datasheet?.id === u.datasheetId,
      );
      // An ally (from another faction) is priced with its ally cost.
      const isAlly =
        byId.get(u.datasheetId)?.faction?.id !== input.factionId;
      const tiers = isAlly
        ? allyCostTiers(unitRows)
        : costTiers(unitRows);

      const chosen = u.costLine
        ? tiers.find((t) => t.line === u.costLine)
        : undefined;

      if (u.costLine && !chosen) {
        throw new BadRequestException(
          `datasheet ${u.datasheetId} has no cost line "${u.costLine}"`,
        );
      }

      const unit = new RosterUnits();
      unit.datasheetId = u.datasheetId;
      unit.datasheetName = byId.get(u.datasheetId)!.name;

      if (chosen) {
        unit.costLine = chosen.line;
        unit.costLabel = chosen.label;
        unit.modelCount = chosen.models;
        unit.pointsAtSave = chosen.pts;
      } else {
        unit.costLine = null;
        unit.costLabel = null;
        unit.modelCount = u.modelCount!;
        unit.pointsAtSave = priceAt(tiers, u.modelCount!);
      }

      // Kept out of pointsAtSave so an errata on either is visible alone.
      const enhancement = enhancements.get(i) ?? null;
      unit.enhancementId = enhancement?.id ?? null;
      unit.enhancementName = enhancement?.name ?? null;
      unit.enhancementPts = enhancement?.pts ?? null;

      unit.wargear = cleanWargear(u.datasheetId, u.wargear);
      unit.attachedToId = null;
      return unit;
    });

    return { name, units: rows };
  }

  // Post-insert like warlordUnitId: the row ids do not exist until then.
  private async resolveAttachments(
    roster: Rosters,
    rows: RosterUnits[],
    input: CreateRosterInput,
  ): Promise<void> {
    const wanted = (input.units ?? []).map(
      (u) => u.attachedToIndex ?? null,
    );

    if (!wanted.some((w) => w != null)) return;

    let changed = false;

    wanted.forEach((target, i) => {
      if (target == null || !rows[i] || !rows[target]) return;
      rows[i].attachedToId = rows[target].id;
      changed = true;
    });

    if (changed) await this.rosters.save(roster);
  }

  async create(input: CreateRosterInput): Promise<Rosters> {
    const { name, units: builtUnits } = await this.build(input);

    const roster = new Rosters();
    roster.name = name;
    roster.factionId = input.factionId;
    roster.subfactionKeyword = input.subfactionKeyword ?? null;
    roster.detachmentId = input.detachmentId ?? null;
    roster.detachmentName = input.detachmentName ?? null;
    roster.battleSize = input.battleSize;
    roster.warlordUnitId = null;
    roster.units = builtUnits;

    roster.pointsAtSave = totalPoints(roster.units);

    const saved = await this.rosters.save(roster);

    await this.resolveAttachments(saved, builtUnits, input);

    // The warlord row's id does not exist until after the insert.
    if (input.warlordDatasheetId) {
      const warlord = saved.units.find(
        (u) => u.datasheetId === input.warlordDatasheetId,
      );

      if (warlord) {
        saved.warlordUnitId = warlord.id;
        await this.rosters.save(saved);
      }
    }

    return saved;
  }

  // Replaces the unit set wholesale rather than diffing: rows carry no
  // client-side identity. orphanedRowAction: 'delete' removes the old rows.
  async update(
    id: string,
    input: CreateRosterInput,
  ): Promise<Rosters> {
    const roster = await this.rosters.findOne({ where: { id } });

    if (!roster) {
      throw new NotFoundException(`Roster ${id} not found`);
    }

    const { name, units: builtUnits } = await this.build(input);

    roster.name = name;
    roster.factionId = input.factionId;
    roster.subfactionKeyword = input.subfactionKeyword ?? null;
    roster.detachmentId = input.detachmentId ?? null;
    roster.detachmentName = input.detachmentName ?? null;
    roster.battleSize = input.battleSize;
    roster.units = builtUnits;
    roster.pointsAtSave = totalPoints(builtUnits);

    // The old warlord's row is gone with the replaced unit set.
    roster.warlordUnitId = null;

    const saved = await this.rosters.save(roster);

    await this.resolveAttachments(saved, builtUnits, input);

    if (input.warlordDatasheetId) {
      const warlord = saved.units.find(
        (u) => u.datasheetId === input.warlordDatasheetId,
      );

      if (warlord) {
        saved.warlordUnitId = warlord.id;
        await this.rosters.save(saved);
      }
    }

    return saved;
  }

  async remove(id: string): Promise<void> {
    const result = await this.rosters.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`Roster ${id} not found`);
    }
  }

  // `withDeleted` is required: without it TypeORM ANDs on `deletedAt IS NULL`
  // and this silently returns nothing, every time.
  async findDeleted(): Promise<Rosters[]> {
    return this.rosters.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      order: { deletedAt: 'DESC' },
    });
  }

  async restore(id: string): Promise<Rosters> {
    const result = await this.rosters.restore(id);

    if (!result.affected) {
      throw new NotFoundException(`Roster ${id} not found`);
    }

    return (await this.findOne(id))!;
  }

  // Hard delete; roster_units cascade. Refuses a live roster so that destroying
  // an army always takes two calls.
  async purge(id: string): Promise<void> {
    const roster = await this.rosters.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!roster) {
      throw new NotFoundException(`Roster ${id} not found`);
    }

    if (!roster.deletedAt) {
      throw new BadRequestException(
        `Roster ${id} is not deleted; delete it before purging`,
      );
    }

    await this.rosters.delete(id);
  }

  async purgeExpired(days: number): Promise<number> {
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const result = await this.rosters.delete({
      deletedAt: LessThan(cutoff),
    });

    return result.affected ?? 0;
  }

  async findAll(factionId?: string): Promise<Rosters[]> {
    return this.rosters.find({
      where: factionId ? { factionId } : {},
      order: { updatedAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Rosters | null> {
    return this.rosters.findOne({ where: { id } });
  }
}

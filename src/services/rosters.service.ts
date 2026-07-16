import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Rosters } from '../entities/rosters';
import { RosterUnits } from '../entities/rosterUnits';
import { Datasheets } from '../entities/datasheets';
import { DatasheetsModelsCost } from '../entities/datasheetsModelsCost';
import { costTiers, priceAt } from '../utils/costs';

export interface RosterUnitInput {
  datasheetId: string;
  /** The chosen datasheets_models_cost line. Authoritative when present. */
  costLine?: string;
  /** Legacy: only used when costLine is absent. */
  modelCount?: number;
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

@Injectable()
export class RostersService {
  constructor(
    @InjectRepository(Rosters)
    private readonly rosters: Repository<Rosters>,
    @InjectRepository(Datasheets)
    private readonly datasheets: Repository<Datasheets>,
    @InjectRepository(DatasheetsModelsCost)
    private readonly costs: Repository<DatasheetsModelsCost>,
  ) {}

  /**
   * Validates the input and builds the unit rows. Shared by create and update
   * so a save behaves identically whichever it turns out to be.
   */
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

    // Validated by lookup rather than by a foreign key: the ids cannot be
    // constrained (imported tables are wiped nightly), so the check has to
    // happen here, at write time, while the snapshot is present.
    const ids = [...new Set(units.map((u) => u.datasheetId))];
    const found = ids.length
      ? await this.datasheets.find({
          where: { id: In(ids) },
          select: { id: true, name: true },
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

    const rows = units.map((u) => {
      // utils/costs, the same parser the arsenal list uses -- a second
      // implementation here is how the saved price drifts from the shown one.
      const tiers = costTiers(
        costRows.filter((c) => c.datasheet?.id === u.datasheetId),
      );

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
        // Legacy path: a roster saved before costLine existed. Ambiguous by
        // construction, which is the whole reason costLine exists.
        unit.costLine = null;
        unit.costLabel = null;
        unit.modelCount = u.modelCount!;
        unit.pointsAtSave = priceAt(tiers, u.modelCount!);
      }

      unit.wargear = null;
      unit.attachedToId = null;
      return unit;
    });

    return { name, units: rows };
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

    roster.pointsAtSave = roster.units.reduce(
      (total, u) => total + (u.pointsAtSave ?? 0),
      0,
    );

    const saved = await this.rosters.save(roster);

    // The Warlord points at a RosterUnits row, whose id only exists after the
    // insert -- so it is resolved on the way out, not on the way in.
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

  /**
   * Replaces a roster in place.
   *
   * Saving twice must not make two armies: create-only meant every click of
   * Save inserted a fresh roster and a fresh copy of all its units, so a build
   * session left a trail of partial snapshots.
   *
   * The unit set is replaced wholesale rather than diffed -- rows carry no
   * client-side identity, and `orphanedRowAction: 'delete'` on the relation is
   * what removes the old ones instead of orphaning them.
   */
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
    roster.pointsAtSave = builtUnits.reduce(
      (total, u) => total + (u.pointsAtSave ?? 0),
      0,
    );

    // The old warlord pointed at a row that no longer exists.
    roster.warlordUnitId = null;

    const saved = await this.rosters.save(roster);

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

  /**
   * Soft delete: `deletedAt` is set and TypeORM's default scope hides the row
   * from every later find. The army is recoverable, which matters because
   * nothing here is undoable from the UI.
   */
  async remove(id: string): Promise<void> {
    const result = await this.rosters.softDelete(id);

    if (!result.affected) {
      throw new NotFoundException(`Roster ${id} not found`);
    }
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

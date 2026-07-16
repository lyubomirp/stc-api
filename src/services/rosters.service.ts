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
  costLine?: string;
  // Legacy: only used when costLine is absent.
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

    // Validated by lookup: the ids cannot carry a foreign key constraint.
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
    roster.pointsAtSave = builtUnits.reduce(
      (total, u) => total + (u.pointsAtSave ?? 0),
      0,
    );

    // The old warlord's row is gone with the replaced unit set.
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

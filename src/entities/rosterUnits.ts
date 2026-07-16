import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rosters } from './rosters';

/**
 * One unit instance in a saved army.
 *
 * One row per unit taken, not per datasheet: two Intercessor Squads with
 * different loadouts are two rows, because the wargear selection lives here.
 * `modelCount` is the models inside this unit (5 or 10), which is what prices
 * it against datasheets_models_cost.
 *
 * `datasheetId` is NOT a foreign key -- see the note on Rosters.
 */
@Entity()
export class RosterUnits {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // The roster is ours, so this one is a real relation: deleting a roster
  // should take its units with it.
  @ManyToOne(() => Rosters, (roster) => roster.units, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn()
  roster: Rosters;

  @Column()
  datasheetId: string;

  /** Snapshot: lets a roster still render if upstream drops the datasheet. */
  @Column()
  datasheetName: string;

  /**
   * Which `datasheets_models_cost` row was chosen -- its `line`.
   *
   * THE identity of this pick. Model count cannot be: 14 datasheets price two
   * different compositions at the same count (Wolf Guard Headtakers is 110 for
   * "3 Headtakers and 3 Hunting Wolves" and 170 for "6 Headtakers", both 6
   * models), so a saved count alone cannot be re-priced.
   *
   * Nullable only for rosters saved before this existed; those fall back to
   * pricing by `modelCount`.
   */
  @Column({ type: 'varchar', nullable: true })
  costLine: string | null;

  /** Snapshot of the chosen row's wording, for the same reason as datasheetName. */
  @Column({ type: 'varchar', nullable: true })
  costLabel: string | null;

  /** Derived from the chosen row, kept for display and sorting. */
  @Column({ type: 'int' })
  modelCount: number;

  /** Points for this unit when it was saved, for the same drift check. */
  @Column({ type: 'int', nullable: true })
  pointsAtSave: number | null;

  /**
   * Chosen wargear, shaped by the datasheet's own option tree
   * (datasheets.wargearOptions). Null until the loadout step writes it.
   */
  @Column({ type: 'jsonb', nullable: true })
  wargear: unknown | null;

  /**
   * The RosterUnits row this one is attached to, when a Character joins a
   * squad. Per unit, not per roster: an army can have several attachments,
   * and a Character can be present without leading anything.
   * datasheets_leader says who *may* lead whom; this records who *did*.
   */
  @Column({ type: 'uuid', nullable: true })
  attachedToId: string | null;
}

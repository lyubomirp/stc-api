import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Rosters } from './rosters';

// One row per unit taken, not per datasheet. `datasheetId` is not a foreign
// key -- see Rosters.
@Entity()
export class RosterUnits {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Postgres does not index the referencing side of an FK, and this relation is
  // eager -- every roster read filters on it.
  @Index()
  @ManyToOne(() => Rosters, (roster) => roster.units, {
    onDelete: 'CASCADE',
    orphanedRowAction: 'delete',
  })
  @JoinColumn()
  roster: Rosters;

  @Column()
  datasheetId: string;

  @Column()
  datasheetName: string;

  // The chosen datasheets_models_cost row. Identifies the price; a model count
  // cannot. Nullable only for rosters saved before it existed.
  @Column({ type: 'varchar', nullable: true })
  costLine: string | null;

  @Column({ type: 'varchar', nullable: true })
  costLabel: string | null;

  @Column({ type: 'int' })
  modelCount: number;

  @Column({ type: 'int', nullable: true })
  pointsAtSave: number | null;

  // Snapshotted and un-keyed like datasheetId -- see the note above.
  @Column({ type: 'varchar', nullable: true })
  enhancementId: string | null;

  @Column({ type: 'varchar', nullable: true })
  enhancementName: string | null;

  @Column({ type: 'int', nullable: true })
  enhancementPts: number | null;

  // WargearPick[]. Free in 10e, so it never affects pointsAtSave.
  @Column({ type: 'jsonb', nullable: true })
  wargear: unknown | null;

  @Column({ type: 'uuid', nullable: true })
  attachedToId: string | null;
}

import {
  Column,
  Entity,
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

  @Column({ type: 'jsonb', nullable: true })
  wargear: unknown | null;

  @Column({ type: 'uuid', nullable: true })
  attachedToId: string | null;
}

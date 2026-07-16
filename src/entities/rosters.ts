import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RosterUnits } from './rosterUnits';

// Ids into imported data are plain columns, never relations: every import
// deletes and reinserts those tables. Each carries a name snapshot.
@Entity()
export class Rosters {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  factionId: string;

  // Nullable columns need an explicit `type` or TypeORM dies at DataSource init.
  @Column({ type: 'varchar', nullable: true })
  subfactionKeyword: string | null;

  @Column({ type: 'varchar', nullable: true })
  detachmentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  detachmentName: string | null;

  @Column({ type: 'int' })
  battleSize: number;

  @Column({ type: 'uuid', nullable: true })
  warlordUnitId: string | null;

  @Column({ type: 'int', nullable: true })
  pointsAtSave: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => RosterUnits, (unit) => unit.roster, {
    cascade: true,
    eager: true,
  })
  units: RosterUnits[];
}

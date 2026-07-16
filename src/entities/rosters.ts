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

/**
 * A saved army. The first user-owned table in the schema: everything else is
 * a projection of the Wahapedia snapshot.
 *
 * NOTHING HERE MAY BE A FOREIGN KEY INTO IMPORTED DATA. Factions, Detachments
 * and Datasheets are all deleted and reinserted by every import (see
 * IMPORT_MANIFEST), so a real reference would make the nightly refresh fail on
 * `DELETE FROM datasheets` the moment one roster existed -- and ON DELETE
 * CASCADE would be worse, silently emptying every saved army instead. The ids
 * below are therefore plain columns, each paired with a name snapshot so a
 * roster still reads sensibly if upstream drops or renames the thing.
 */
@Entity()
export class Rosters {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  /** Wahapedia faction id, e.g. "EC". Deliberately not a relation. */
  @Column()
  factionId: string;

  // `type` is explicit on every nullable column: a `string | null` field
  // reflects as `Object`, which TypeORM cannot map to a Postgres type, and it
  // fails at DataSource init rather than at compile time.
  /** A keyword ("Ultramarines"), not an id -- sub-factions are derived. */
  @Column({ type: 'varchar', nullable: true })
  subfactionKeyword: string | null;

  @Column({ type: 'varchar', nullable: true })
  detachmentId: string | null;

  @Column({ type: 'varchar', nullable: true })
  detachmentName: string | null;

  /** Points cap: 1000 Incursion, 2000 Strike Force, 3000 Onslaught. */
  @Column({ type: 'int' })
  battleSize: number;

  /** The RosterUnits row nominated as Warlord. Not a relation: it would be circular. */
  @Column({ type: 'uuid', nullable: true })
  warlordUnitId: string | null;

  /**
   * Total at the moment of saving. The live total is always recomputed from
   * the current points, so this exists only to notice that upstream moved --
   * a 2000pt army can quietly become 2015pt after an errata.
   */
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

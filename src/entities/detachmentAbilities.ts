import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Factions } from './factions';
import { Detachments } from './detachments';
import { DatasheetsDetachmentAbilities } from './datasheetsDetachmentAbilities';

@Entity()
export class DetachmentAbilities {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  legend: string;

  @Column()
  description: string;

  @Column()
  detachment: string;

  @ManyToOne(() => Factions, (faction) => faction.detachmentAbilities)
  faction: Factions;

  @OneToMany(
    () => DatasheetsDetachmentAbilities,
    (datasheetDetachmentAbilities) =>
      datasheetDetachmentAbilities.detachmentAbility,
  )
  datasheetDetachmentAbilities: DatasheetsDetachmentAbilities[];

  @ManyToOne(
    () => Detachments,
    (detachment) => detachment.detachmentAbilities,
    { nullable: true },
  )
  detachmentRef: Detachments;
}

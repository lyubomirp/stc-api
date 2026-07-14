import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Factions } from './factions';
import { Detachments } from './detachments';
import { DatasheetsStratagems } from './datasheetsStratagems';

@Entity()
export class Stratagems {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  type: string;

  @Column({ nullable: true })
  cpCost: number;

  @Column({ type: 'text', nullable: true })
  legend: string;

  @Column({ nullable: true })
  turn: string;

  @Column({ nullable: true })
  phase: string;

  @Column({ nullable: true })
  detachment: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(
    () => DatasheetsStratagems,
    (datasheetStratagems) => datasheetStratagems.stratagem,
  )
  datasheetStratagems: DatasheetsStratagems[];

  @ManyToOne(() => Factions, (faction) => faction.stratagems)
  faction: Factions;

  @ManyToOne(
    () => Detachments,
    (detachment) => detachment.stratagems,
    { nullable: true },
  )
  detachmentRef: Detachments;
}

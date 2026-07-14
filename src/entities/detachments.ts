import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Factions } from './factions';
import { Stratagems } from './stratagems';
import { Enhancements } from './enhancements';
import { DetachmentAbilities } from './detachmentAbilities';

@Entity()
export class Detachments {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  legend: string;

  @Column({ type: 'text', nullable: true })
  type: string;

  @ManyToOne(() => Factions, (faction) => faction.detachments)
  faction: Factions;

  @OneToMany(() => Stratagems, (stratagem) => stratagem.detachmentRef)
  stratagems: Stratagems[];

  @OneToMany(
    () => Enhancements,
    (enhancement) => enhancement.detachmentRef,
  )
  enhancements: Enhancements[];

  @OneToMany(
    () => DetachmentAbilities,
    (detachmentAbility) => detachmentAbility.detachmentRef,
  )
  detachmentAbilities: DetachmentAbilities[];
}

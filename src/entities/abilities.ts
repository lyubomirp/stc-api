import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Factions } from './factions';
import { DatasheetsAbilities } from './datasheetsAbilities';

@Entity()
export class Abilities {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  legend: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(
    () => DatasheetsAbilities,
    (datasheetAbilities) => datasheetAbilities.ability,
  )
  @JoinColumn({ name: 'id' })
  datasheetAbilities: DatasheetsAbilities[];

  @ManyToMany(() => Factions, (faction) => faction.abilities)
  @JoinTable({
    name: 'abilities_factions',
    joinColumn: { name: 'abilityId', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'factionId',
      referencedColumnName: 'id',
    },
  })
  factions: Factions[];
}

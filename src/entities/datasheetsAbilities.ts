import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Datasheets } from './datasheets';
import { Abilities } from './abilities';

@Entity()
export class DatasheetsAbilities {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  line: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  type: string;

  @Column({ nullable: true })
  parameter: string;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetAbilities,
    { nullable: false },
  )
  datasheet: Datasheets;

  @ManyToOne(() => Abilities, (ability) => ability.datasheetAbilities)
  ability: Abilities;
}

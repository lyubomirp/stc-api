import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Datasheets } from './datasheets';

@Entity()
export class DatasheetsWargear {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true })
  line: string;

  @Column()
  lineInWargear: string;

  @Column({ nullable: true })
  dice: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  range: string;

  @Column({ nullable: true })
  type: string;

  @Column()
  a: string;

  @Column()
  bsWs: string;

  @Column()
  s: string;

  @Column()
  ap: string;

  @Column()
  d: string;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetWargear,
    { nullable: false },
  )
  datasheet: Datasheets;
}

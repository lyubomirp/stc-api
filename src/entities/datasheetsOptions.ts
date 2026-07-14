import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Datasheets } from './datasheets';

@Entity()
export class DatasheetsOptions {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true })
  line: string;

  @Column()
  button: string;

  @Column()
  description: string;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetOptions,
    { nullable: false },
  )
  datasheet: Datasheets;
}

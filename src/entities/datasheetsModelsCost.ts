import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Datasheets } from './datasheets';

@Entity()
export class DatasheetsModelsCost {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  line: string;

  @Column()
  description: string;

  @Column()
  cost: string;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetModelsCost,
    { nullable: false },
  )
  datasheet: Datasheets;
}

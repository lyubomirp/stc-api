import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Datasheets } from './datasheets';

@Entity()
export class DatasheetsUnitComposition {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  line: string;

  @Column()
  description: string;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetUnitCompositions,
    { nullable: false },
  )
  datasheet: Datasheets;
}

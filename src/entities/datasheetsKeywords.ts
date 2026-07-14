import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Datasheets } from './datasheets';

@Entity()
export class DatasheetsKeywords {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true })
  keyword: string;

  @Column({ nullable: true })
  model: string;

  @Column()
  isFactionKeyword: string;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetKeywords,
    { nullable: false },
  )
  datasheet: Datasheets;
}

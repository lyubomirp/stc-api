import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Datasheets } from './datasheets';

@Entity()
export class DatasheetsModels {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ nullable: true })
  line: string;

  @Column({ nullable: true })
  name: string;

  @Column()
  m: string;

  @Column()
  t: string;

  @Column()
  sv: string;

  @Column({ nullable: true })
  invSv: string;

  @Column({ nullable: true })
  invSvDescr: string;

  @Column()
  w: string;

  @Column()
  ld: string;

  @Column()
  oc: string;

  @Column({ nullable: true })
  baseSize: string;

  @Column({ nullable: true })
  baseSizeDescr: string;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetModels,
    { nullable: false },
  )
  datasheet: Datasheets;
}

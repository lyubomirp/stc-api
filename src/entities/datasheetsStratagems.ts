import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Datasheets } from './datasheets';
import { Stratagems } from './stratagems';

@Entity()
export class DatasheetsStratagems {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetStratagems,
    { nullable: false },
  )
  datasheet: Datasheets;

  @ManyToOne(
    () => Stratagems,
    (stratagem) => stratagem.datasheetStratagems,
    { nullable: false },
  )
  stratagem: Stratagems;
}

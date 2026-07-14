import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Datasheets } from './datasheets';

@Entity()
export class Source {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  edition: string;

  @Column({ nullable: true })
  version: string;

  @Column({ nullable: true })
  errataDate: string;

  @Column({ nullable: true })
  errataLink: string;

  @OneToMany(() => Datasheets, (datasheet) => datasheet.source)
  datasheets: Datasheets[];
}

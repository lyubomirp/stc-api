import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Datasheets } from './datasheets';
import { DetachmentAbilities } from './detachmentAbilities';

@Entity()
export class DatasheetsDetachmentAbilities {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(
    () => Datasheets,
    (datasheet) => datasheet.datasheetDetachmentAbilities,
    { nullable: false },
  )
  datasheet: Datasheets;

  @ManyToOne(
    () => DetachmentAbilities,
    (detachmentAbility) =>
      detachmentAbility.datasheetDetachmentAbilities,
    { nullable: false },
  )
  detachmentAbility: DetachmentAbilities;
}

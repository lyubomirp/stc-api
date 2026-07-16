import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { Factions } from './factions';
import { Source } from './source';
import { DatasheetsKeywords } from './datasheetsKeywords';
import { DatasheetsAbilities } from './datasheetsAbilities';
import { DatasheetsModels } from './datasheetsModels';
import { DatasheetsOptions } from './datasheetsOptions';
import { DatasheetsWargear } from './datasheetsWargear';
import { DatasheetsModelsCost } from './datasheetsModelsCost';
import { DatasheetsStratagems } from './datasheetsStratagems';
import { DatasheetsEnhancements } from './datasheetsEnhancements';
import { DatasheetsUnitComposition } from './datasheetsUnitComposition';
import { DatasheetsDetachmentAbilities } from './datasheetsDetachmentAbilities';
import { DatasheetsLeader } from './datasheetsLeader';
import { WargearUnit } from '../config/wargearOptions';

@Entity()
export class Datasheets {
  @PrimaryColumn()
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  legend: string;

  @Column({ nullable: true })
  role: string;

  @Column({ nullable: true })
  loadout: string;

  @Column({ nullable: true })
  transport: string;

  @Column()
  virtual: string;

  @Column({ nullable: true })
  leaderHead: string;

  @Column({ nullable: true })
  leaderFooter: string;

  @Column({ nullable: true })
  damagedW: string;

  @Column({ nullable: true })
  damagedDescription: string;

  @Column()
  link: string;

  // From BSData, applied by ImportService inside the import transaction.
  // jsonb because nothing queries into it.
  @Column({ type: 'jsonb', nullable: true })
  wargearOptions: WargearUnit | null;

  @OneToMany(
    () => DatasheetsKeywords,
    (datasheetKeywords) => datasheetKeywords.datasheet,
  )
  datasheetKeywords: DatasheetsKeywords[];

  @OneToMany(
    () => DatasheetsModels,
    (datasheetModels) => datasheetModels.datasheet,
  )
  datasheetModels: DatasheetsModels[];

  @OneToMany(
    () => DatasheetsAbilities,
    (datasheetAbilities) => datasheetAbilities.datasheet,
  )
  datasheetAbilities: DatasheetsAbilities[];

  @OneToMany(
    () => DatasheetsOptions,
    (datasheetOptions) => datasheetOptions.datasheet,
  )
  datasheetOptions: DatasheetsOptions[];

  @OneToMany(
    () => DatasheetsWargear,
    (datasheetWargear) => datasheetWargear.datasheet,
  )
  datasheetWargear: DatasheetsWargear[];

  @OneToMany(
    () => DatasheetsUnitComposition,
    (datasheetUnitCompositions) =>
      datasheetUnitCompositions.datasheet,
  )
  datasheetUnitCompositions: DatasheetsUnitComposition[];

  @OneToMany(
    () => DatasheetsModelsCost,
    (datasheetModelsCost) => datasheetModelsCost.datasheet,
  )
  datasheetModelsCost: DatasheetsModelsCost[];

  @OneToMany(
    () => DatasheetsStratagems,
    (datasheetStratagems) => datasheetStratagems.datasheet,
  )
  datasheetStratagems: DatasheetsStratagems[];

  @OneToMany(
    () => DatasheetsEnhancements,
    (datasheetEnhancements) => datasheetEnhancements.datasheet,
  )
  datasheetEnhancements: DatasheetsEnhancements[];

  @OneToMany(
    () => DatasheetsDetachmentAbilities,
    (datasheetDetachmentAbilities) =>
      datasheetDetachmentAbilities.datasheet,
  )
  datasheetDetachmentAbilities: DatasheetsDetachmentAbilities[];

  @OneToMany(
    () => DatasheetsLeader,
    (datasheetLeader) => datasheetLeader.leader,
  )
  datasheetLeaders: DatasheetsLeader[];

  @OneToMany(
    () => DatasheetsLeader,
    (datasheetLeader) => datasheetLeader.attached,
  )
  datasheetAttached: DatasheetsLeader[];

  @ManyToOne(() => Factions, (faction) => faction.datasheets)
  faction: Factions;

  @ManyToOne(() => Source, (source) => source.datasheets)
  @JoinColumn()
  source: Source;
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { AbilitiesService } from '../services/abilities.service';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsAbilitiesService } from '../services/datasheetsAbilities.service';
import { DatasheetsDetachmentAbilitiesService } from '../services/datasheetsDetachmentAbilities.service';
import { DatasheetsEnhancementsService } from '../services/datasheetsEnhancements.service';
import { DatasheetsKeywordsService } from '../services/datasheetsKeywords.service';
import { DatasheetsLeaderService } from '../services/datasheetsLeader.service';
import { DatasheetsModelsService } from '../services/datasheetsModels.service';
import { DatasheetsModelsCostService } from '../services/datasheetsModelsCost.service';
import { DatasheetsOptions } from '../entities/datasheetsOptions';
import { DatasheetsStratagemsService } from '../services/datasheetsStratagems.service';
import { DatasheetsUnitCompositionService } from '../services/datasheetsUnitComposition.service';
import { DatasheetsWargearService } from '../services/datasheetsWargear.service';
import { EnhancementsService } from '../services/enhancements.service';
import { FactionsService } from '../services/factions.service';
import { LastUpdateService } from '../services/lastUpdate.service';
import { SourceService } from '../services/source.service';
import { StratagemsService } from '../services/stratagems.service';
import { DatasheetsModels } from '../entities/datasheetsModels';
import { EntityManager } from 'typeorm';
import { Factions } from '../entities/factions';
import { Datasheets } from '../entities/datasheets';
import { Abilities } from '../entities/abilities';
import { DatasheetsAbilities } from '../entities/datasheetsAbilities';
import { DatasheetsDetachmentAbilities } from '../entities/datasheetsDetachmentAbilities';
import { DatasheetsEnhancements } from '../entities/datasheetsEnhancements';
import { DatasheetsKeywords } from '../entities/datasheetsKeywords';
import { DatasheetsLeader } from '../entities/datasheetsLeader';
import { DatasheetsModelsCost } from '../entities/datasheetsModelsCost';
import { DatasheetsStratagems } from '../entities/datasheetsStratagems';
import { DatasheetsUnitComposition } from '../entities/datasheetsUnitComposition';
import { DatasheetsWargear } from '../entities/datasheetsWargear';
import { Enhancements } from '../entities/enhancements';
import { LastUpdate } from '../entities/lastUpdate';
import { Source } from '../entities/source';
import { Stratagems } from '../entities/stratagems';
import { DatasheetsOptionsService } from '../services/datasheetsOptions.service';
import { DetachmentAbilitiesService } from '../services/detachmentAbilities.service';
import { DetachmentAbilities } from '../entities/detachmentAbilities';
import { DetachmentsService } from '../services/detachments.service';
import { Detachments } from '../entities/detachments';
import { ImportService } from '../services/import.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Abilities,
      Datasheets,
      DatasheetsAbilities,
      DatasheetsDetachmentAbilities,
      DatasheetsEnhancements,
      DatasheetsKeywords,
      DatasheetsKeywords,
      DatasheetsLeader,
      DatasheetsModels,
      DatasheetsModelsCost,
      DatasheetsOptions,
      DatasheetsStratagems,
      DatasheetsUnitComposition,
      DatasheetsWargear,
      DetachmentAbilities,
      Detachments,
      Enhancements,
      Factions,
      LastUpdate,
      Source,
      Stratagems,
    ]),
    HttpModule,
    ConfigModule,
    EntityManager,
  ],
  exports: [ImportService],
  providers: [
    ImportService,
    {
      provide: 'abilitiesService',
      useClass: AbilitiesService,
    },
    {
      provide: 'datasheetsService',
      useClass: DatasheetsService,
    },
    {
      provide: 'datasheetsAbilitiesService',
      useClass: DatasheetsAbilitiesService,
    },
    {
      provide: 'datasheetsDetachmentAbilitiesService',
      useClass: DatasheetsDetachmentAbilitiesService,
    },
    {
      provide: 'detachmentAbilitiesService',
      useClass: DetachmentAbilitiesService,
    },
    {
      provide: 'detachmentsService',
      useClass: DetachmentsService,
    },
    {
      provide: 'datasheetsEnhancementsService',
      useClass: DatasheetsEnhancementsService,
    },
    {
      provide: 'datasheetsKeywordsService',
      useClass: DatasheetsKeywordsService,
    },
    {
      provide: 'datasheetsLeaderService',
      useClass: DatasheetsLeaderService,
    },
    {
      provide: 'datasheetsModelsService',
      useClass: DatasheetsModelsService,
    },
    {
      provide: 'datasheetsModelsCostService',
      useClass: DatasheetsModelsCostService,
    },
    {
      provide: 'datasheetsOptionsService',
      useClass: DatasheetsOptionsService,
    },
    {
      provide: 'datasheetsStratagemsService',
      useClass: DatasheetsStratagemsService,
    },
    {
      provide: 'datasheetsUnitCompositionService',
      useClass: DatasheetsUnitCompositionService,
    },
    {
      provide: 'datasheetsWargearService',
      useClass: DatasheetsWargearService,
    },
    {
      provide: 'enhancementsService',
      useClass: EnhancementsService,
    },
    {
      provide: 'factionsService',
      useClass: FactionsService,
    },
    {
      provide: 'lastUpdateService',
      useClass: LastUpdateService,
    },
    {
      provide: 'sourceService',
      useClass: SourceService,
    },
    {
      provide: 'stratagemsService',
      useClass: StratagemsService,
    },
  ],
  controllers: [],
})
export class ImportModule {}

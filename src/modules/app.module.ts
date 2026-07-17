import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/Configuration';
import { AppController } from '../controllers/app.controller';
import { AppService } from '../services/app.service';
import { DatabaseModule } from './database.module';
import { CronModule } from './cron.module';
import { DetachmentsModule } from './detachments.module';
import { AbilitiesModule } from './abilities.module';
import { FactionsModule } from './factions.module';
import { DatasheetsModule } from './datasheets.module';
import { DatasheetsModelsModule } from './datasheetsModels.module';
import { DatasheetsUnitCompositionModule } from './datasheetsUnitComposition.module';
import { DatasheetsStratagemsModule } from './datasheetsStratagems.module';
import { DatasheetsWargearModule } from './datasheetsWargear.module';
import { DatasheetsAbilitiesModule } from './datasheetsAbilities.module';
import { DatasheetsOptionsModule } from './datasheetsOptions.module';
import { DatasheetsLeaderModule } from './datasheetsLeader.module';
import { DatasheetsEnhancementsModule } from './datasheetsEnhancements.module';
import { RostersModule } from './rosters.module';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    DatabaseModule,
    ScheduleModule.forRoot(),
    AbilitiesModule,
    FactionsModule,
    DatasheetsModule,
    DatasheetsModelsModule,
    DatasheetsUnitCompositionModule,
    DatasheetsStratagemsModule,
    DatasheetsWargearModule,
    DatasheetsAbilitiesModule,
    DatasheetsOptionsModule,
    DatasheetsLeaderModule,
    DatasheetsEnhancementsModule,
    DetachmentsModule,
    RostersModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasheetsEnhancements } from '../entities/datasheetsEnhancements';
import { Datasheets } from '../entities/datasheets';
import { DatasheetsEnhancementsService } from '../services/datasheetsEnhancements.service';
import { LeaderGrantsService } from '../services/leaderGrants.service';
import { DatasheetsEnhancementsController } from '../controllers/datasheets-enhancements.controller';
import { DatasheetsModule } from './datasheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DatasheetsEnhancements, Datasheets]),
    DatasheetsModule,
  ],
  exports: [DatasheetsEnhancementsService, LeaderGrantsService],
  providers: [DatasheetsEnhancementsService, LeaderGrantsService],
  controllers: [DatasheetsEnhancementsController],
})
export class DatasheetsEnhancementsModule {}

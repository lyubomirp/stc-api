import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatasheetsEnhancements } from '../entities/datasheetsEnhancements';
import { DatasheetsEnhancementsService } from '../services/datasheetsEnhancements.service';
import { DatasheetsEnhancementsController } from '../controllers/datasheets-enhancements.controller';
import { DatasheetsModule } from './datasheets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DatasheetsEnhancements]),
    DatasheetsModule,
  ],
  exports: [DatasheetsEnhancementsService],
  providers: [DatasheetsEnhancementsService],
  controllers: [DatasheetsEnhancementsController],
})
export class DatasheetsEnhancementsModule {}

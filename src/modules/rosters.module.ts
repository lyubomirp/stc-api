import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rosters } from '../entities/rosters';
import { RosterUnits } from '../entities/rosterUnits';
import { Datasheets } from '../entities/datasheets';
import { DatasheetsModelsCost } from '../entities/datasheetsModelsCost';
import { DatasheetsLeader } from '../entities/datasheetsLeader';
import { DatasheetsEnhancements } from '../entities/datasheetsEnhancements';
import { RostersService } from '../services/rosters.service';
import { RostersController } from '../controllers/rosters.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Rosters,
      RosterUnits,
      Datasheets,
      DatasheetsModelsCost,
      DatasheetsLeader,
      DatasheetsEnhancements,
    ]),
  ],
  exports: [RostersService],
  providers: [RostersService],
  controllers: [RostersController],
})
export class RostersModule {}

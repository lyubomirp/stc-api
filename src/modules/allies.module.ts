import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Datasheets } from '../entities/datasheets';
import { AlliedForcesService } from '../services/alliedForces.service';
import { AlliesController } from '../controllers/allies.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Datasheets])],
  exports: [AlliedForcesService],
  providers: [AlliedForcesService],
  controllers: [AlliesController],
})
export class AlliesModule {}

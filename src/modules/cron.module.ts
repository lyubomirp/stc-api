import { Module } from '@nestjs/common';
import { CronService } from '../services/cron.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { LastUpdateModule } from './lastUpdate.module';
import { ImportModule } from './import.module';
import { RostersModule } from './rosters.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    LastUpdateModule,
    ImportModule,
    RostersModule,
  ],
  exports: [],
  providers: [CronService],
  controllers: [],
})
export class CronModule {}

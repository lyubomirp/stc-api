import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/Configuration';
import { DatabaseModule } from './database.module';
import { ImportModule } from './import.module';

// No ScheduleModule: a manual run must not also register the cron.
@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration], isGlobal: true }),
    DatabaseModule,
    ImportModule,
  ],
})
export class CliModule {}

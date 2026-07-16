import { Module } from '@nestjs/common';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Abilities } from '../entities/abilities';
import { Datasheets } from '../entities/datasheets';
import { DatasheetsLeader } from '../entities/datasheetsLeader';
import { DatasheetsAbilities } from '../entities/datasheetsAbilities';
import { DatasheetsEnhancements } from '../entities/datasheetsEnhancements';
import { DatasheetsDetachmentAbilities } from '../entities/datasheetsDetachmentAbilities';
import { DatasheetsStratagems } from '../entities/datasheetsStratagems';
import { DatasheetsModelsCost } from '../entities/datasheetsModelsCost';
import { DatasheetsUnitComposition } from '../entities/datasheetsUnitComposition';
import { DatasheetsKeywords } from '../entities/datasheetsKeywords';
import { DatasheetsModels } from '../entities/datasheetsModels';
import { DatasheetsOptions } from '../entities/datasheetsOptions';
import { DatasheetsWargear } from '../entities/datasheetsWargear';
import { Factions } from '../entities/factions';
import { Source } from '../entities/source';
import { Stratagems } from '../entities/stratagems';
import { Enhancements } from '../entities/enhancements';
import { Detachments } from '../entities/detachments';
import { DetachmentAbilities } from '../entities/detachmentAbilities';
import { LastUpdate } from '../entities/lastUpdate';
import { Rosters } from '../entities/rosters';
import { RosterUnits } from '../entities/rosterUnits';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: configService.get<TypeOrmModuleOptions>(
          'database.type',
          {
            // We need to infer or else useFactory blows a gasket
            infer: true,
          },
        ),
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        entities: [
          Factions,
          Source,
          Stratagems,
          Enhancements,
          Detachments,
          DetachmentAbilities,
          Abilities,
          Datasheets,
          DatasheetsLeader,
          DatasheetsAbilities,
          DatasheetsEnhancements,
          DatasheetsDetachmentAbilities,
          DatasheetsStratagems,
          DatasheetsModelsCost,
          DatasheetsUnitComposition,
          DatasheetsKeywords,
          DatasheetsModels,
          DatasheetsOptions,
          DatasheetsWargear,
          LastUpdate,
          // User-owned, not imported: these survive the refresh, which is why
          // they hold no foreign key into anything above.
          Rosters,
          RosterUnits,
        ],
        migrations: ['./migrations/*.ts'],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

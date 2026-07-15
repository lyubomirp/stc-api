import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { FactionsService } from '../services/factions.service';
import { Datasheets } from '../entities/datasheets';

@Controller()
export class DatasheetsController {
  constructor(
    private readonly datasheetsService: DatasheetsService,
    private readonly factionService: FactionsService,
  ) {}

  @Get('/datasheets/:factionId')
  async index(
    @Param('factionId') factionId: string,
  ): Promise<Datasheets[]> {
    const faction = await this.factionService.findOne(factionId);

    if (!faction) {
      throw new NotFoundException(`Faction ${factionId} not found`);
    }

    return this.datasheetsService.findByFaction(faction);
  }

  @Get('/datasheets/single/:datasheetId')
  async getOne(
    @Param('datasheetId') datasheetId: string,
  ): Promise<Datasheets> {
    const datasheet =
      await this.datasheetsService.findOne(datasheetId);

    if (!datasheet) {
      throw new NotFoundException(
        `Datasheet ${datasheetId} not found`,
      );
    }

    return datasheet;
  }
}

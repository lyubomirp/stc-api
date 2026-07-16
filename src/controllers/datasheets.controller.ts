import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  DatasheetListItem,
  DatasheetsService,
} from '../services/datasheets.service';
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
    @Query('subfaction') subfaction?: string,
  ): Promise<DatasheetListItem[]> {
    const faction = await this.factionService.findOne(factionId);

    if (!faction) {
      throw new NotFoundException(`Faction ${factionId} not found`);
    }

    // Filtered server-side: the client has no keywords to filter on, and
    // fetching them all just to narrow a list would undo the projection.
    // The sub-faction set comes from FactionsService, which owns that
    // derivation -- re-deriving it here is how the two drift apart.
    const excluded = subfaction
      ? (await this.factionService.findSubfactions(factionId))
          .map((s) => s.keyword)
          .filter((k) => k.toLowerCase() !== subfaction.toLowerCase())
      : [];

    return this.datasheetsService.findByFaction(faction, excluded);
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

import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Query,
} from '@nestjs/common';
import {
  DatasheetListItem,
  DatasheetSearchHit,
  DatasheetsService,
} from '../services/datasheets.service';
import { FactionsService } from '../services/factions.service';
import { Datasheets } from '../entities/datasheets';

const MIN_SEARCH = 3;
const PAGE_SIZE = 25;

@Controller()
export class DatasheetsController {
  constructor(
    private readonly datasheetsService: DatasheetsService,
    private readonly factionService: FactionsService,
  ) {}

  // Must stay above /datasheets/:factionId -- Nest matches in declaration order
  // and ':factionId' would otherwise swallow 'search'.
  @Get('/datasheets/search')
  async search(
    @Query('q') q = '',
    @Query('page') page = '1',
  ): Promise<{
    items: DatasheetSearchHit[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const trimmed = (q ?? '').trim();
    const pageNum = Math.max(1, parseInt(page, 10) || 1);

    if (trimmed.length < MIN_SEARCH) {
      return { items: [], total: 0, page: pageNum, pageSize: PAGE_SIZE };
    }

    const { items, total } = await this.datasheetsService.search(
      trimmed,
      pageNum,
      PAGE_SIZE,
    );

    return { items, total, page: pageNum, pageSize: PAGE_SIZE };
  }

  @Get('/datasheets/:factionId')
  async index(
    @Param('factionId') factionId: string,
    @Query('subfaction') subfaction?: string,
  ): Promise<DatasheetListItem[]> {
    const faction = await this.factionService.findOne(factionId);

    if (!faction) {
      throw new NotFoundException(`Faction ${factionId} not found`);
    }

    // The sub-faction derivation lives in FactionsService; do not re-derive it.
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

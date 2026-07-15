import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { FactionsService } from '../services/factions.service';
import { Factions } from '../entities/factions';

@Controller()
export class FactionController {
  constructor(private readonly factionService: FactionsService) {}

  @Get('/factions')
  async index(): Promise<Factions[]> {
    return this.factionService.findAll();
  }

  /** Detachment contents and keyword members are fetched on demand. */
  @Get('/factions/:factionId/overview')
  async overview(@Param('factionId') factionId: string) {
    const faction = await this.requireFaction(factionId);

    const [abilities, subfactions, detachments, keywords] =
      await Promise.all([
        this.factionService.findAbilities(factionId),
        this.factionService.findSubfactions(factionId),
        this.factionService.findDetachments(factionId),
        this.factionService.findKeywords(factionId),
      ]);

    return { faction, abilities, subfactions, detachments, keywords };
  }

  @Get('/factions/:factionId/keywords/:keyword')
  async byKeyword(
    @Param('factionId') factionId: string,
    @Param('keyword') keyword: string,
  ) {
    await this.requireFaction(factionId);

    return this.factionService.findDatasheetsByKeyword(
      factionId,
      keyword,
    );
  }

  private async requireFaction(factionId: string): Promise<Factions> {
    const faction = await this.factionService.findOne(factionId);

    if (!faction) {
      throw new NotFoundException(`Faction ${factionId} not found`);
    }

    return faction;
  }
}

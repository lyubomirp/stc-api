import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsEnhancementsService } from '../services/datasheetsEnhancements.service';
import { LeaderGrantsService } from '../services/leaderGrants.service';

export interface EnhancementOption {
  id: string;
  name: string;
  pts: number;
  detachment: string;
  detachmentId: string | null;
  description: string;
  // Datasheet ids this enhancement lets its bearer lead beyond the base
  // datasheets_leader pairings. Present only for the handful that grant one.
  grantsAttachmentTo?: string[];
}

@Controller()
export class DatasheetsEnhancementsController {
  constructor(
    private readonly datasheetsEnhancementsService: DatasheetsEnhancementsService,
    private readonly datasheetsService: DatasheetsService,
    private readonly leaderGrants: LeaderGrantsService,
  ) {}

  // Across every detachment; the client filters by the selected one.
  @Get('/datasheets-enhancements/:datasheetId')
  async index(
    @Param('datasheetId') datasheetId: string,
  ): Promise<EnhancementOption[]> {
    const datasheet = await this.datasheetsService.findOne(
      datasheetId,
      {
        faction: true,
      },
    );

    if (!datasheet) {
      throw new NotFoundException(
        `Datasheet ${datasheetId} not found`,
      );
    }

    const options =
      await this.datasheetsEnhancementsService.findForDatasheet(
        datasheet.id,
      );

    // An enhancement belongs to its bearer's faction, so the datasheet's
    // faction scopes the grant -- no per-enhancement faction lookup needed.
    const factionId = datasheet.faction?.id;

    if (factionId) {
      await Promise.all(
        options.map(async (option) => {
          if (!this.leaderGrants.hasGrant(option.name)) return;
          option.grantsAttachmentTo = await this.leaderGrants.resolve(
            option.name,
            factionId,
          );
        }),
      );
    }

    return options;
  }
}

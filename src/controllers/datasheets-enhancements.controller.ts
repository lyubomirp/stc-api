import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsEnhancementsService } from '../services/datasheetsEnhancements.service';

export interface EnhancementOption {
  id: string;
  name: string;
  pts: number;
  detachment: string;
  detachmentId: string | null;
  description: string;
}

@Controller()
export class DatasheetsEnhancementsController {
  constructor(
    private readonly datasheetsEnhancementsService: DatasheetsEnhancementsService,
    private readonly datasheetsService: DatasheetsService,
  ) {}

  // Across every detachment; the client filters by the selected one.
  @Get('/datasheets-enhancements/:datasheetId')
  async index(
    @Param('datasheetId') datasheetId: string,
  ): Promise<EnhancementOption[]> {
    const datasheet =
      await this.datasheetsService.findOne(datasheetId);

    if (!datasheet) {
      throw new NotFoundException(
        `Datasheet ${datasheetId} not found`,
      );
    }

    return this.datasheetsEnhancementsService.findForDatasheet(
      datasheet.id,
    );
  }
}

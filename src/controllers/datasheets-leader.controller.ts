import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsLeaderService } from '../services/datasheetsLeader.service';
import { DatasheetsLeader } from '../entities/datasheetsLeader';

@Controller()
export class DatasheetsLeaderController {
  constructor(
    private readonly datasheetsLeaderService: DatasheetsLeaderService,
    private readonly datasheetsService: DatasheetsService,
  ) {}

  @Get('/datasheets-leader/:datasheetId')
  async index(
    @Param('datasheetId') datasheetId: string,
  ): Promise<DatasheetsLeader[]> {
    const datasheet =
      await this.datasheetsService.findOne(datasheetId);

    if (!datasheet) {
      throw new NotFoundException(
        `Datasheet ${datasheetId} not found`,
      );
    }

    return await this.datasheetsLeaderService.findAllById(datasheet);
  }
}

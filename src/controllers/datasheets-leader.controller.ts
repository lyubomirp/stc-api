import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsLeaderService } from '../services/datasheetsLeader.service';
import { DatasheetsLeader } from '../entities/datasheetsLeader';
import { Datasheets } from '../entities/datasheets';

@Controller()
export class DatasheetsLeaderController {
  constructor(
    private readonly datasheetsLeaderService: DatasheetsLeaderService,
    private readonly datasheetsService: DatasheetsService,
  ) {}

  // Who may lead this unit.
  @Get('/datasheets-leader/:datasheetId')
  async index(
    @Param('datasheetId') datasheetId: string,
  ): Promise<DatasheetsLeader[]> {
    return this.datasheetsLeaderService.findAllById(
      await this.require(datasheetId),
    );
  }

  // What this leader may join.
  @Get('/datasheets-leader/:datasheetId/leads')
  async leads(
    @Param('datasheetId') datasheetId: string,
  ): Promise<{ id: string; name: string }[]> {
    const rows = await this.datasheetsLeaderService.findLeadableBy(
      await this.require(datasheetId),
    );

    return rows.map((row) => ({
      id: row.attached.id,
      name: row.attached.name,
    }));
  }

  private async require(datasheetId: string): Promise<Datasheets> {
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

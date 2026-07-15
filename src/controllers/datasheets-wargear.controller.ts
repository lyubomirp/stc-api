import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsWargearService } from '../services/datasheetsWargear.service';
import { DatasheetsWargear } from '../entities/datasheetsWargear';

@Controller()
export class DatasheetsWargearController {
  constructor(
    private readonly datasheetsWargearService: DatasheetsWargearService,
    private readonly datasheetsService: DatasheetsService,
  ) {}

  @Get('/datasheets-wargear/:datasheetId')
  async index(
    @Param('datasheetId') datasheetId: string,
  ): Promise<DatasheetsWargear[]> {
    const datasheet =
      await this.datasheetsService.findOne(datasheetId);

    if (!datasheet) {
      throw new NotFoundException(
        `Datasheet ${datasheetId} not found`,
      );
    }

    return await this.datasheetsWargearService.findByDatasheet(
      datasheet,
      {},
      {
        name: true,
        range: true,
        a: true,
        bsWs: true,
        s: true,
        ap: true,
        d: true,
      },
    );
  }
}

import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsAbilitiesService } from '../services/datasheetsAbilities.service';
import { DatasheetsAbilities } from '../entities/datasheetsAbilities';

@Controller()
export class DatasheetsAbilitiesController {
  constructor(
    private readonly datasheetsAbilitiesService: DatasheetsAbilitiesService,
    private readonly datasheetsService: DatasheetsService,
  ) {}

  @Get('/datasheets-abilities/:datasheetId')
  async index(
    @Param('datasheetId') datasheetId: string,
  ): Promise<any> {
    const datasheet =
      await this.datasheetsService.findOne(datasheetId);

    if (!datasheet) {
      throw new NotFoundException(
        `Datasheet ${datasheetId} not found`,
      );
    }

    const result =
      await this.datasheetsAbilitiesService.findByDatasheet(
        datasheet,
        { ability: true },
      );

    return result.reduce<Record<string, DatasheetsAbilities[]>>(
      (acc, val) => {
        const type = val.type;
        (acc[type] ??= []).push(val);
        return acc;
      },
      {},
    );
  }
}

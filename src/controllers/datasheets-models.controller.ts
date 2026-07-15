import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsModelsService } from '../services/datasheetsModels.service';
import { DatasheetsService } from '../services/datasheets.service';

@Controller()
export class DatasheetsModelsController {
  constructor(
    private readonly datasheetsModelsService: DatasheetsModelsService,
    private readonly datasheetsService: DatasheetsService,
  ) {}

  @Get('/datasheets-models/:datasheetId')
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

    return await this.datasheetsModelsService.findByDatasheet(
      datasheet,
    );
  }
}

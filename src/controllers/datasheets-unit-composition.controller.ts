import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsUnitCompositionService } from '../services/datasheetsUnitComposition.service';
import { DatasheetsModelsCostService } from '../services/datasheetsModelsCost.service';

@Controller()
export class DatasheetsUnitCompositionController {
  constructor(
    private readonly datasheetsUnitCompositionService: DatasheetsUnitCompositionService,
    private readonly datasheetsService: DatasheetsService,
    private readonly datasheetsModelsCostService: DatasheetsModelsCostService,
  ) {}

  @Get('/datasheets-unit-composition/:datasheetId')
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

    // Combining these two due to similar use on FE
    // Unit Compositions and costs should always be fairly close
    // will break into separate requests if needed
    const cost =
      await this.datasheetsModelsCostService.findByDatasheet(
        datasheet,
      );
    const unitComp =
      await this.datasheetsUnitCompositionService.findByDatasheet(
        datasheet,
      );

    return { costs: cost, comp: unitComp };
  }
}

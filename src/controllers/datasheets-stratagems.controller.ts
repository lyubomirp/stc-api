import {
  Controller,
  Get,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { DatasheetsService } from '../services/datasheets.service';
import { DatasheetsStratagemsService } from '../services/datasheetsStratagems.service';
import { Stratagems } from '../entities/stratagems';

@Controller()
export class DatasheetsStratagemsController {
  constructor(
    private readonly datasheetsStratagemsService: DatasheetsStratagemsService,
    private readonly datasheetsService: DatasheetsService,
  ) {}

  @Get('/datasheets-stratagems/:datasheetId')
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
      await this.datasheetsStratagemsService.findByDatasheet(
        datasheet,
        { stratagem: true },
      );

    return result.reduce<{
      detachments: string[];
      stratagems: Stratagems[];
    }>(
      (acc, val) => {
        const detachment = val.stratagem.detachment;

        acc.stratagems.push(val.stratagem);

        if (detachment && !acc.detachments.includes(detachment)) {
          acc.detachments.push(detachment);
        }

        return acc;
      },
      { detachments: [], stratagems: [] },
    );
  }
}

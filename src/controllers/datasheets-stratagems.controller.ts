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

    // `description` and `legend` are the bulk of a stratagem row and
    // are not rendered in the list.
    const result =
      await this.datasheetsStratagemsService.findByDatasheet(
        datasheet,
        { stratagem: { detachmentRef: true } },
        {
          stratagem: {
            id: true,
            name: true,
            cpCost: true,
            type: true,
            turn: true,
            phase: true,
            detachmentRef: { id: true, name: true },
          },
        },
      );

    return result.reduce<{
      detachments: { id: string; name: string }[];
      stratagems: Stratagems[];
    }>(
      (acc, val) => {
        // Carry the detachment FK id so the client filters by id, never by
        // matching the denormalised name string.
        const ref = val.stratagem.detachmentRef;

        acc.stratagems.push(val.stratagem);

        if (ref && !acc.detachments.some((d) => d.id === ref.id)) {
          acc.detachments.push({ id: ref.id, name: ref.name });
        }

        return acc;
      },
      { detachments: [], stratagems: [] },
    );
  }
}

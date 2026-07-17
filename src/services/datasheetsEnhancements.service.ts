import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { DatasheetsEnhancements } from '../entities/datasheetsEnhancements';
import { EnhancementOption } from '../controllers/datasheets-enhancements.controller';
import { enhancementCost } from '../utils/costs';

@Injectable()
export class DatasheetsEnhancementsService extends BaseService(
  DatasheetsEnhancements,
) {
  async findForDatasheet(
    datasheetId: string,
  ): Promise<EnhancementOption[]> {
    const rows = await this.repository.find({
      where: { datasheet: { id: datasheetId } },
      relations: { enhancement: { detachmentRef: true } },
    });

    return rows
      .map((row): EnhancementOption | null => {
        const e = row.enhancement;
        const pts = enhancementCost(e.cost);

        return pts == null
          ? null
          : {
              id: e.id,
              name: e.name,
              pts,
              detachment: e.detachment,
              detachmentId: e.detachmentRef?.id ?? null,
              description: e.description,
            };
      })
      .filter((e): e is EnhancementOption => e !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
  }
}

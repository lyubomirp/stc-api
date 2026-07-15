import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from './base.service';
import { Detachments } from '../entities/detachments';
import { DetachmentAbilities } from '../entities/detachmentAbilities';
import { Stratagems } from '../entities/stratagems';
import { Enhancements } from '../entities/enhancements';

export interface DetachmentOverview {
  detachment: Detachments;
  rules: DetachmentAbilities[];
  stratagems: Stratagems[];
  enhancements: Enhancements[];
}

@Injectable()
export class DetachmentsService extends BaseService(Detachments) {
  async findOne(id: string): Promise<Detachments | null> {
    return this.repository.findOne({ where: { id } });
  }

  /** Everything Wahapedia shows on a detachment: lore, rule, stratagems, enhancements. */
  async findOverview(id: string): Promise<DetachmentOverview> {
    const detachment = await this.findOne(id);

    if (!detachment) {
      throw new NotFoundException(`Detachment ${id} not found`);
    }

    const [rules, stratagems, enhancements] = await Promise.all([
      this.dataSource.getRepository(DetachmentAbilities).find({
        where: { detachmentRef: { id } },
        order: { name: 'ASC' },
      }),
      this.dataSource.getRepository(Stratagems).find({
        where: { detachmentRef: { id } },
        order: { name: 'ASC' },
      }),
      this.dataSource.getRepository(Enhancements).find({
        where: { detachmentRef: { id } },
        order: { name: 'ASC' },
      }),
    ]);

    return { detachment, rules, stratagems, enhancements };
  }
}

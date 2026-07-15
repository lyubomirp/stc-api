import { Injectable } from '@nestjs/common';
import { Factions } from '../entities/factions';
import { BaseService } from './base.service';

@Injectable()
export class FactionsService extends BaseService(Factions) {
  async findOne(id: string): Promise<Factions | null> {
    return this.repository.findOne({ where: { id } });
  }
}

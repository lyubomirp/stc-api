import { Controller, Get, Param } from '@nestjs/common';
import {
  AlliedForcesService,
  AlliedFamilyPayload,
} from '../services/alliedForces.service';

@Controller()
export class AlliesController {
  constructor(private readonly alliedForces: AlliedForcesService) {}

  // The allied families a primary faction may draw from, each with its pool
  // (ally-priced), categories and caps. Empty array when ineligible.
  @Get('/allies/:factionId')
  async index(
    @Param('factionId') factionId: string,
  ): Promise<AlliedFamilyPayload[]> {
    return this.alliedForces.forFaction(factionId);
  }
}

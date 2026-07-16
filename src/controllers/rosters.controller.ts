import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  CreateRosterInput,
  RostersService,
} from '../services/rosters.service';
import { Rosters } from '../entities/rosters';

/**
 * The app's first write surface -- every other route is a read-only projection
 * of the import. Nothing here is authenticated and main.ts still has
 * `origin: '*'`, so this is safe only while the API is local.
 */
@Controller()
export class RostersController {
  constructor(private readonly rostersService: RostersService) {}

  @Post('/rosters')
  async create(@Body() body: CreateRosterInput): Promise<Rosters> {
    return this.rostersService.create(body);
  }

  // Saving an army the client already saved must not mint a second one.
  @Put('/rosters/:id')
  async update(
    @Param('id') id: string,
    @Body() body: CreateRosterInput,
  ): Promise<Rosters> {
    return this.rostersService.update(id, body);
  }

  // Soft delete -- the row survives, later finds just stop seeing it.
  @Delete('/rosters/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    return this.rostersService.remove(id);
  }

  @Get('/rosters')
  async index(
    @Query('factionId') factionId?: string,
  ): Promise<Rosters[]> {
    return this.rostersService.findAll(factionId);
  }

  @Get('/rosters/:id')
  async getOne(@Param('id') id: string): Promise<Rosters> {
    const roster = await this.rostersService.findOne(id);

    if (!roster) {
      throw new NotFoundException(`Roster ${id} not found`);
    }

    return roster;
  }
}

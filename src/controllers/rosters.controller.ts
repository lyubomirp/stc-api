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

// Unauthenticated, and main.ts still has origin: '*' -- local only.
@Controller()
export class RostersController {
  constructor(private readonly rostersService: RostersService) {}

  @Post('/rosters')
  async create(@Body() body: CreateRosterInput): Promise<Rosters> {
    return this.rostersService.create(body);
  }

  @Put('/rosters/:id')
  async update(
    @Param('id') id: string,
    @Body() body: CreateRosterInput,
  ): Promise<Rosters> {
    return this.rostersService.update(id, body);
  }

  @Delete('/rosters/:id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    return this.rostersService.remove(id);
  }

  @Post('/rosters/:id/restore')
  async restore(@Param('id') id: string): Promise<Rosters> {
    return this.rostersService.restore(id);
  }

  @Delete('/rosters/:id/permanent')
  @HttpCode(204)
  async purge(@Param('id') id: string): Promise<void> {
    return this.rostersService.purge(id);
  }

  @Get('/rosters')
  async index(
    @Query('factionId') factionId?: string,
  ): Promise<Rosters[]> {
    return this.rostersService.findAll(factionId);
  }

  // Must stay above /rosters/:id -- Nest matches in declaration order and
  // ':id' would swallow 'deleted'.
  @Get('/rosters/deleted')
  async deleted(): Promise<Rosters[]> {
    return this.rostersService.findDeleted();
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

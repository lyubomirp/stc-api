import { Controller, Get, Param } from '@nestjs/common';
import {
  DetachmentOverview,
  DetachmentsService,
} from '../services/detachments.service';

@Controller()
export class DetachmentsController {
  constructor(
    private readonly detachmentsService: DetachmentsService,
  ) {}

  @Get('/detachments/:detachmentId')
  async overview(
    @Param('detachmentId') detachmentId: string,
  ): Promise<DetachmentOverview> {
    return this.detachmentsService.findOverview(detachmentId);
  }
}

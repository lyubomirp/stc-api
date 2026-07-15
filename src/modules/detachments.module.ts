import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Detachments } from '../entities/detachments';
import { DetachmentsService } from '../services/detachments.service';
import { DetachmentsController } from '../controllers/detachments.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Detachments])],
  exports: [DetachmentsService],
  providers: [DetachmentsService],
  controllers: [DetachmentsController],
})
export class DetachmentsModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Detachments } from '../entities/detachments';
import { DetachmentsService } from '../services/detachments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Detachments])],
  exports: [DetachmentsService],
  providers: [DetachmentsService],
  controllers: [],
})
export class DetachmentsModule {}

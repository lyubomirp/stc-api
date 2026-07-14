import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { Detachments } from '../entities/detachments';

@Injectable()
export class DetachmentsService extends BaseService(Detachments) {}

import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { DatasheetsModelsCost } from '../entities/datasheetsModelsCost';

@Injectable()
export class DatasheetsModelsCostService extends BaseService(
  DatasheetsModelsCost,
) {}

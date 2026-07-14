import { Injectable } from '@nestjs/common';
import { BaseService } from './base.service';
import { DatasheetsWargear } from '../entities/datasheetsWargear';

@Injectable()
export class DatasheetsWargearService extends BaseService(
  DatasheetsWargear,
) {}

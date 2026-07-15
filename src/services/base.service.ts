import { Injectable, Type } from '@nestjs/common';
import {
  DataSource,
  EntityManager,
  InsertResult,
  ObjectLiteral,
  Repository,
  UpdateResult,
} from 'typeorm';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { Datasheets } from '../entities/datasheets';

type Constructor<T> = new (...args: any[]) => T;

// Postgres caps a statement at 65535 bind parameters.
const INSERT_BATCH_SIZE = 500;

export interface IBaseServiceHost<T extends ObjectLiteral> {
  readonly repository: Repository<T>;
  readonly dataSource: DataSource;
  findAll: () => Promise<T[]>;
  delete: (id: number) => Promise<void>;
  createMany: (data: T[], manager: EntityManager) => Promise<void>;
  deleteAll: (manager: EntityManager) => Promise<void>;
  findByDatasheet: (
    datasheet: Datasheets,
    relations?: object,
    select?: object,
  ) => Promise<T[]>;
  create: (data: T) => Promise<InsertResult>;
  updateOne: (
    id: string | number,
    data: any,
  ) => Promise<UpdateResult>;
}

export const BaseService = <T extends ObjectLiteral>(
  resourceType: Constructor<T>,
): Type<IBaseServiceHost<T>> => {
  @Injectable()
  class BaseServiceHost<T extends ObjectLiteral> {
    @InjectRepository(resourceType)
    readonly repository: Repository<T>;
    @InjectDataSource()
    readonly dataSource: DataSource;

    async findAll(): Promise<T[]> {
      return this.repository.find();
    }

    async updateOne(
      id: string | number,
      data: any,
    ): Promise<UpdateResult> {
      return this.repository.update(id, data);
    }

    async findByDatasheet(
      datasheet: Datasheets,
      relations?: object,
      select?: object,
    ): Promise<T[]> {
      // Match the foreign key only. Passing the entity makes TypeORM
      // build a where across all of its properties, which errors on
      // any that are null.
      let searchObj = {
        where: { datasheet: { id: datasheet.id } },
      };

      if (relations) {
        searchObj = Object.assign(searchObj, {
          relations,
        });
      }

      if (select) {
        searchObj = Object.assign(searchObj, {
          select,
        });
      }

      // @ts-expect-error: Not a datasheet derivative
      return await this.repository.find(searchObj);
    }

    async delete(id: number): Promise<void> {
      await this.repository.delete(id);
    }

    async create(entity: T): Promise<InsertResult> {
      return this.repository.insert(
        entity as QueryDeepPartialEntity<T>,
      );
    }

    async createMany(
      data: T[],
      manager: EntityManager,
    ): Promise<void> {
      if (!data.length) {
        return;
      }

      for (let i = 0; i < data.length; i += INSERT_BATCH_SIZE) {
        await manager
          .createQueryBuilder()
          .insert()
          .into(resourceType)
          .values(
            data.slice(
              i,
              i + INSERT_BATCH_SIZE,
            ) as QueryDeepPartialEntity<any>[],
          )
          .execute();
      }
    }

    async deleteAll(manager: EntityManager): Promise<void> {
      await manager
        .createQueryBuilder()
        .delete()
        .from(resourceType)
        .execute();
    }
  }

  return BaseServiceHost;
};

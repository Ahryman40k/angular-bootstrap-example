import * as express from 'express';
import { IPaginatedResult } from '../../utils/utils';
import { Entity } from '../domain/entity';
import { SearchUseCase } from '../domain/useCases/searchUseCase/searchUseCase';
import { IFindPaginatedProps } from '../findOptions/findPaginated';
import { UseCaseController } from '../useCaseController';

const autobind = require('autobind-decorator');

@autobind
export abstract class SearchController<F extends IFindPaginatedProps, DTO> extends UseCaseController<
  F,
  IPaginatedResult<DTO>
> {
  protected abstract useCase: SearchUseCase<Entity<any>, DTO, F>;
  protected reqToInput(req: express.Request): F {
    const { offset, limit, expand, orderBy, fields, countBy, ...criterias } = Object.keys(req.query).length
      ? req.query
      : req.body;
    return {
      criterias,
      limit,
      offset,
      orderBy,
      fields: this.getFields(fields),
      countBy,
      expand
    } as F;
  }

  private getFields(fields: string | string[]): string[] {
    if (Array.isArray(fields)) {
      return fields;
    }
    return fields ? fields.split(',') : [];
  }
}

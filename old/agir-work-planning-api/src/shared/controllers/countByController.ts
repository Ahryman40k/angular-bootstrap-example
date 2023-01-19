import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { Entity } from '../domain/entity';
import { CountByUseCase } from '../domain/useCases/countUseCase/countByUseCase';
import { IFindOptionsProps } from '../findOptions/findOptions';
import { UseCaseController } from '../useCaseController';

@autobind
export abstract class CountByController<E extends Entity<any>, F extends IFindOptionsProps> extends UseCaseController<
  F,
  ICountBy
> {
  protected abstract useCase: CountByUseCase<E, F>;
  protected reqToInput(req: express.Request): F {
    const { countBy, ...criterias } = req.query;
    return { countBy, criterias } as F;
  }
}

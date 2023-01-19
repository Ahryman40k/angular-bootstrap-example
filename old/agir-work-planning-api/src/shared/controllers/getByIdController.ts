import * as autobind from 'autobind-decorator';
import { Entity } from '../domain/entity';
import { GetByIdUseCase } from '../domain/useCases/getByIdUseCase/getByIdUseCase';
import { FindOne } from '../findOptions/findOne';
import { IFindOptionsProps } from '../findOptions/findOptions';
import { ByIdController } from './byIdController';

@autobind
export abstract class GetByIdController<
  E extends Entity<any>,
  O,
  F extends FindOne<IFindOptionsProps>
> extends ByIdController<O> {
  protected abstract useCase: GetByIdUseCase<E, O, F>;
}

import { IBaseRepository } from '../../../repositories/core/baseRepository';
import { FindOptions } from '../../findOptions/findOptions';
import { Result } from '../../logic/result';
import { ByIdCommand, IByIdCommandProps } from './byIdCommand';
import { UseCase } from './useCase';

export abstract class ByIdUseCase<E extends any, O> extends UseCase<IByIdCommandProps, O> {
  protected abstract readonly entityRepository: IBaseRepository<E, FindOptions<any>>;
  protected entity: E;

  protected abstract createCommand(req: IByIdCommandProps): Result<ByIdCommand<IByIdCommandProps>>;
}

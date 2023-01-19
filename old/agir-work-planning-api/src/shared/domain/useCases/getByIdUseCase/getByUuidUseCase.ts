import { FindOne } from '../../../findOptions/findOne';
import { IFindOptionsProps } from '../../../findOptions/findOptions';
import { Result } from '../../../logic/result';
import { Entity } from '../../entity';
import { ByIdCommand } from '../byIdCommand';
import { ByUuidCommand, IByUuidCommandProps } from '../byUuidCommand';
import { GetByIdUseCase } from './getByIdUseCase';

export abstract class GetByUuidUseCase<
  E extends Entity<any>,
  D,
  F extends FindOne<IFindOptionsProps>
> extends GetByIdUseCase<E, D, F> {
  protected createCommand(req: IByUuidCommandProps): Result<ByIdCommand<any>> {
    return ByUuidCommand.create(req);
  }
}

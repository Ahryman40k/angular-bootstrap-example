import { Result } from '../../../logic/result';
import { Entity } from '../../entity';
import { ByIdCommand } from '../byIdCommand';
import { ByUuidCommand, IByUuidCommandProps } from '../byUuidCommand';
import { DeleteByIdUseCase } from './deleteByIdUseCase';

export abstract class DeleteByUuidUseCase<E extends Entity<any>> extends DeleteByIdUseCase<E> {
  protected createCommand(req: IByUuidCommandProps): Result<ByIdCommand<any>> {
    return ByUuidCommand.create(req);
  }
}

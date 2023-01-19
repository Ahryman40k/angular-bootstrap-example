import * as autobind from 'autobind-decorator';
import { Entity } from '../domain/entity';
import { DeleteByIdUseCase } from '../domain/useCases/deleteUseCase/deleteByIdUseCase';
import { ByIdController } from './byIdController';

@autobind
export abstract class DeleteByIdController<E extends Entity<any>> extends ByIdController<void> {
  protected abstract useCase: DeleteByIdUseCase<E>;
  protected success = this.done;
}

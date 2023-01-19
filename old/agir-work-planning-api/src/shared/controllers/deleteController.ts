import * as autobind from 'autobind-decorator';
import { Entity } from '../domain/entity';
import { DeleteUseCase } from '../domain/useCases/deleteUseCase/deleteUseCase';
import { UseCaseController } from '../useCaseController';

@autobind
export abstract class DeleteController<E extends Entity<any>, I> extends UseCaseController<I, void> {
  protected abstract useCase: DeleteUseCase<E, I>;
  protected success = this.done;
}

import { Result } from '../../../logic/result';
import { Entity } from '../../entity';
import { UseCase } from '../useCase';

export abstract class DeleteUseCase<E extends Entity<any>, I extends any> extends UseCase<I, void> {
  protected abstract createCommand(req: any): Result<any>;

  protected async validateBusinessRules(entity: E): Promise<Result<any>> {
    return Result.ok();
  }
}

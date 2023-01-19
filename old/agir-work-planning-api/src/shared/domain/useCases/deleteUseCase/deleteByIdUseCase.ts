import { IHistoryOptions } from '../../../../features/history/mongo/historyRepository';
import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { ForbiddenError } from '../../../domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../domainErrors/invalidParameterError';
import { NotFoundError } from '../../../domainErrors/notFoundError';
import { UnexpectedError } from '../../../domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../domainErrors/unprocessableEntityError';
import { FindOptions } from '../../../findOptions/findOptions';
import { IGuardResult } from '../../../logic/guard';
import { left } from '../../../logic/left';
import { Result } from '../../../logic/result';
import { right } from '../../../logic/right';
import { Entity } from '../../entity';
import { IByIdCommandProps } from '../byIdCommand';
import { Response } from '../useCase';
import { DeleteUseCase } from './deleteUseCase';

export abstract class DeleteByIdUseCase<E extends Entity<any>> extends DeleteUseCase<E, IByIdCommandProps> {
  protected abstract readonly entityRepository: IBaseRepository<E, FindOptions<any>>;
  protected entity: E;

  protected get historyOptions(): IHistoryOptions {
    return undefined;
  }

  // Expand may be necessary for business rules but not given on a delete by id route
  protected getExpands(): string[] {
    return [];
  }

  // override this method to add specific authorization when deleting entity
  // this method return error of type 403
  protected async validateAuthorization(): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  public async execute(req: IByIdCommandProps): Promise<Response<void>> {
    const deleteCmdResult = this.createCommand(req);
    if (deleteCmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combine([deleteCmdResult]).error));
    }
    const command = deleteCmdResult.getValue();

    this.entity = await this.entityRepository.findById(command.id, this.getExpands());
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${command.id} was not found`));
    }

    const authorizationResults = await this.validateAuthorization();
    if (authorizationResults.isFailure) {
      return left(new ForbiddenError(authorizationResults.errorValue()));
    }

    const businessRulesResults = await this.validateBusinessRules(this.entity);
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    const deleteEntityResult = await this.entityRepository.delete(
      FindOptions.create({
        criterias: {
          id: command.id
        }
      }).getValue(),
      this.historyOptions
    );

    if (deleteEntityResult.isFailure) {
      return left(new UnexpectedError(Result.combineForError(deleteEntityResult)));
    }
    return right(Result.ok<void>());
  }
}

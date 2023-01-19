import { IComment } from '@villemontreal/agir-work-planning-lib/dist/src';

import { constants } from '../../../../../config/constants';
import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { DeleteByIdUseCase } from '../../../../shared/domain/useCases/deleteUseCase/deleteByIdUseCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { FindOptions } from '../../../../shared/findOptions/findOptions';
import { GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { DeleteCommentCommand, IDeleteCommentCommandProps } from './deleteCommentCommand';

export abstract class DeleteCommentUseCase<
  E extends any // E extends CommentableEntity, => when projects/interventions is refactorised
> extends DeleteByIdUseCase<any> {
  protected abstract readonly entityRepository: IBaseRepository<E, FindOptions<any>>;
  protected entity: E;

  protected createCommand(req: IDeleteCommentCommandProps): Result<DeleteCommentCommand> {
    return DeleteCommentCommand.create(req, GuardType.VALID_UUID);
  }

  protected async validateBusinessRules(entity: E): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async validatePermissions(commentToBeDeleted: IComment): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected validateRestrictions(entity: E): Result<IGuardResult> {
    return Result.ok();
  }

  public async execute(req: IDeleteCommentCommandProps): Promise<any> {
    const cmdResult = this.createCommand(req);
    if (cmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(cmdResult)));
    }
    const deleteCmd: DeleteCommentCommand = cmdResult.getValue();

    this.entity = await this.entityRepository.findById(deleteCmd.id);
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${deleteCmd.id} was not found`));
    }
    // tslint:disable:no-string-literal
    const comments: IComment[] = this.entity['comments'];
    const indexOfCommentToDelete = comments.findIndex(comment => comment.id === deleteCmd.commentId);
    if (indexOfCommentToDelete === -1) {
      return left(new NotFoundError(`Comment ${deleteCmd.commentId} was not found`));
    }

    const restrictionsResults = this.validateRestrictions(this.entity);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }

    const businessRulesResults: Result<IGuardResult> = await this.validateBusinessRules(this.entity);
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    const permissionsResult = await this.validatePermissions(comments[indexOfCommentToDelete]);
    if (permissionsResult.isFailure) {
      return left(new ForbiddenError(permissionsResult.errorValue()));
    }
    // remove comment from array
    comments.splice(indexOfCommentToDelete, 1);

    // save updated entity
    const savedEntityResult: Result<E> = await this.entityRepository.save(this.entity, {
      history: {
        categoryId: constants.historyCategoryId.COMMENT,
        comments: constants.systemMessages.COMMENT_DELETED,
        operation: constants.operation.DELETE
      }
    });
    if (savedEntityResult.isFailure) {
      return left(new UnexpectedError(savedEntityResult.errorValue()));
    }
    return right(Result.ok<void>());
  }
}

import { IComment } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, omit } from 'lodash';

import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { FindOptions } from '../../../../shared/findOptions/findOptions';
import { IGuardResult } from '../../../../shared/logic/guard';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { IHistoryOptions } from '../../../history/mongo/historyRepository';
import { IPlainCommentProps } from '../../models/plainComment';
import { CommentValidator } from '../../validators/commentValidator';
import { IUpsertCommentCommandProps, UpsertCommentCommand } from './upsertCommentCommand';

export abstract class UpsertCommentUseCase<
  E extends any // E extends CommentableEntity, => when projects/interventions is refactorised
> extends UseCase<IPlainCommentProps, Response<IComment>> {
  protected abstract entityRepository: IBaseRepository<E, FindOptions<any>>;
  protected abstract historyOptions: IHistoryOptions;
  protected entity: E;
  protected comments: IComment[] = [];

  protected abstract doJob(upsertCommand: UpsertCommentCommand<IUpsertCommentCommandProps>): Promise<Result<IComment>>;

  protected abstract createCommand(
    req: IUpsertCommentCommandProps
  ): Result<UpsertCommentCommand<IUpsertCommentCommandProps>>;

  protected async validateTaxonomies(): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async validateBusinessRules(entity: E): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async validatePermissions(options: IUpsertCommentCommandProps): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected validateRestrictions(entity: E): Result<IGuardResult> {
    return Result.ok();
  }

  public async execute(req: IUpsertCommentCommandProps): Promise<any> {
    const [cmdResult, openApiResult, taxonomyResult] = await Promise.all([
      this.createCommand(req),
      CommentValidator.validateAgainstOpenApi(omit(req, ['id', 'commentId']) as IPlainCommentProps),
      CommentValidator.validateTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([cmdResult, openApiResult, taxonomyResult]);

    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(inputValidationResult)));
    }
    const upsertCommentCmd = cmdResult.getValue();

    this.entity = await this.entityRepository.findById(upsertCommentCmd.id);
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${upsertCommentCmd.id} was not found`));
    }

    const restrictionsResults = this.validateRestrictions(this.entity);
    if (restrictionsResults.isFailure) {
      return left(new ForbiddenError(restrictionsResults.errorValue()));
    }
    const businessRulesResults: Result<IGuardResult> = await this.validateBusinessRules(this.entity);
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }

    // tslint:disable:no-string-literal
    if (isEmpty(this.entity['comments'])) {
      this.entity['comments'] = [];
    }
    this.comments = this.entity['comments'];

    const permissionsResult = await this.validatePermissions(upsertCommentCmd);
    if (permissionsResult.isFailure) {
      return left(new ForbiddenError(permissionsResult.errorValue()));
    }

    const result: Result<IComment> = await this.doJob(upsertCommentCmd);
    if (result.isFailure) {
      if (result.errorValue().constructor === NotFoundError) {
        return left(result.errorValue());
      }
      return left(new UnexpectedError(result.errorValue()));
    }

    // save updated entity
    const savedEntityResult: Result<E> = await this.entityRepository.save(this.entity, {
      history: this.historyOptions
    });
    if (savedEntityResult.isFailure) {
      return left(new UnexpectedError(savedEntityResult.errorValue()));
    }

    // should use mapper here and add/update function return a Comment
    return right(Result.ok<IComment>(result.getValue()));
  }
}

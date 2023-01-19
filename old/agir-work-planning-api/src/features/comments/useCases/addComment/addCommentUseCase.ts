import { CommentCategory, IComment } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';
import { constants } from '../../../../../config/constants';
import { GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { Audit } from '../../../audit/audit';
import { commentMapperDTO } from '../../mappers/commentMapperDTO';
import { Comment } from '../../models/comment';
import { UpsertCommentUseCase } from '../upsertComment/upsertCommentUseCase';
import { AddCommentCommand, IAddCommentCommandProps } from './addCommentCommand';

export abstract class AddCommentUseCase<
  E extends any // E extends CommentableEntity, => when projects/interventions is refactorised
> extends UpsertCommentUseCase<E> {
  protected historyOptions = {
    categoryId: constants.historyCategoryId.COMMENT,
    comments: constants.systemMessages.COMMENT_ADDED,
    operation: constants.operation.CREATE
  };

  protected createCommand(req: IAddCommentCommandProps): Result<AddCommentCommand<IAddCommentCommandProps>> {
    return AddCommentCommand.create(req, GuardType.VALID_UUID);
  }

  protected async doJob(addCommentCmd: AddCommentCommand<IAddCommentCommandProps>): Promise<Result<IComment>> {
    const commentResult = Comment.create({
      categoryId: addCommentCmd.categoryId || CommentCategory.information,
      text: addCommentCmd.text,
      isPublic: !isNil(addCommentCmd.isPublic) ? addCommentCmd.isPublic : true,
      isProjectVisible: addCommentCmd.isProjectVisible,
      audit: Audit.fromCreateContext()
    });
    if (commentResult.isFailure) {
      return commentResult;
    }

    // TODO should be a Comment instance and mapped in parent UpsertCommentUseCase
    const newComment: IComment = await commentMapperDTO.getFromModel(commentResult.getValue());
    this.comments.push(newComment);
    return Result.ok(newComment);
  }
}

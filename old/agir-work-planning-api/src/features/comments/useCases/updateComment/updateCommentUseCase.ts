import { IComment } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isNil } from 'lodash';
import { constants } from '../../../../../config/constants';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { Audit } from '../../../audit/audit';
import { commentMapperDTO } from '../../mappers/commentMapperDTO';
import { Comment } from '../../models/comment';
import { UpsertCommentUseCase } from '../upsertComment/upsertCommentUseCase';
import { IUpdateCommentCommandProps, UpdateCommentCommand } from './updateCommentCommand';

export abstract class UpdateCommentUseCase<
  E extends any // E extends CommentableEntity, => when projects/interventions is refactorised
> extends UpsertCommentUseCase<E> {
  protected historyOptions = {
    categoryId: constants.historyCategoryId.COMMENT,
    comments: constants.systemMessages.COMMENT_UPDATED,
    operation: constants.operation.UPDATE
  };

  protected createCommand(req: IUpdateCommentCommandProps): Result<UpdateCommentCommand<IUpdateCommentCommandProps>> {
    return UpdateCommentCommand.create(req, GuardType.VALID_UUID);
  }

  protected async doJob(updateCmd: UpdateCommentCommand<IUpdateCommentCommandProps>): Promise<Result<IComment>> {
    const indexOfCommentToUpdate = this.comments.findIndex(comment => comment.id === updateCmd.commentId);
    if (indexOfCommentToUpdate === -1) {
      return Result.fail(new NotFoundError(`Comment ${updateCmd.commentId} was not found`));
    }
    const existingComment = this.comments[indexOfCommentToUpdate];
    const commentResult = Comment.create(
      {
        categoryId: updateCmd.categoryId || existingComment.categoryId,
        text: updateCmd.text || existingComment.text,
        isPublic: !isNil(updateCmd.isPublic) ? updateCmd.isPublic : existingComment.isPublic,
        isProjectVisible: !isNil(updateCmd.isProjectVisible)
          ? updateCmd.isProjectVisible
          : existingComment.isProjectVisible,
        audit: Audit.fromUpdateContext(Audit.generateAuditFromIAudit(existingComment.audit))
      },
      updateCmd.commentId
    );
    if (commentResult.isFailure) {
      return commentResult;
    }
    // must map it to DTO as intervention and project are not entities...
    // and the splice wont work with Comment instance
    const updatedComment: IComment = await commentMapperDTO.getFromModel(commentResult.getValue());
    // update comment in array
    this.comments.splice(indexOfCommentToUpdate, 1, updatedComment);
    return Result.ok(updatedComment);
  }
}

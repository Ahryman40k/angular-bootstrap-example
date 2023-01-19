import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { DeleteByIdController } from '../../../../shared/controllers/deleteByIdController';
import { IDeleteCommentCommandProps } from './deleteCommentCommand';
import { DeleteCommentUseCase } from './deleteCommentUseCase';

@autobind
export abstract class DeleteCommentController<E extends any> extends DeleteByIdController<any> {
  // E extends Entity<any> Commentable
  protected abstract useCase: DeleteCommentUseCase<E>;

  protected reqToInput(req: express.Request): IDeleteCommentCommandProps {
    return {
      id: req.params.id,
      commentId: req.params.idComment
    };
  }
}

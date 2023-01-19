import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { UpsertCommentController } from '../upsertComment/upsertCommentController';
import { IUpdateCommentCommandProps } from './updateCommentCommand';
import { UpdateCommentUseCase } from './updateCommentUseCase';

@autobind
export abstract class UpdateCommentController<E extends any> extends UpsertCommentController<E> {
  protected abstract useCase: UpdateCommentUseCase<E>;
  protected success = this.ok;

  protected reqToInput(req: express.Request): IUpdateCommentCommandProps {
    return {
      ...super.reqToInput(req),
      commentId: req.params.idComment
    };
  }
}

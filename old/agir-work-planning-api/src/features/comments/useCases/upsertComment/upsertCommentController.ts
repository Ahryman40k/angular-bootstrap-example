import { IComment } from '@villemontreal/agir-work-planning-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import { ByIdController } from '../../../../shared/controllers/byIdController';
import { IUpsertCommentCommandProps } from './upsertCommentCommand';
import { UpsertCommentUseCase } from './upsertCommentUseCase';

@autobind
export abstract class UpsertCommentController<E extends any> extends ByIdController<IComment> {
  // E extends Entity<any> Commentable
  protected abstract useCase: UpsertCommentUseCase<E>;

  protected reqToInput(req: express.Request): IUpsertCommentCommandProps {
    return {
      ...req.body,
      id: req.params.id
    };
  }
}

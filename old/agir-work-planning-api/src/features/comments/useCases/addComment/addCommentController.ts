import * as autobind from 'autobind-decorator';
import { UpsertCommentController } from '../upsertComment/upsertCommentController';

@autobind
export abstract class AddCommentController<E extends any> extends UpsertCommentController<E> {
  // E extends Entity<any> Commentable
  protected success = this.created;
}

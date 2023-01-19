import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Constructor } from '../../../shared/domain/genericEntity';
import { Comment } from './comment';

export interface ICommentableProps {
  comments?: Comment[];
}

interface ICommentable {
  comments: Comment[];
  setComments(comments: Comment[]): void;
}

// tslint:disable:function-name
export function Commentable<T extends Constructor<AggregateRoot<ICommentableProps>>>(
  base: T
): T & Constructor<ICommentable> {
  return class extends base {
    public get comments(): Comment[] {
      return this.props.comments;
    }

    public setComments(comments: Comment[]): void {
      this.props.comments = comments;
    }
  };
}

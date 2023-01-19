import { toPersistanceMongoId } from '../../../shared/domain/entity';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { auditable } from '../../../shared/mixins/mixins';
import { Audit } from '../../audit/audit';
import { IAuditableProps } from '../../audit/auditable';
import { ICommentAttributes } from '../mongo/commentSchema';
import { IPlainCommentProps, PlainComment } from './plainComment';

export interface ICommentProps extends IPlainCommentProps, IAuditableProps {}

export class Comment extends auditable(PlainComment)<ICommentProps> {
  public static create(props: ICommentProps, id?: string): Result<Comment> {
    const guard = this.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guard, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<Comment>(guardResult);
    }
    const comment = new Comment(props, id);
    return Result.ok<Comment>(comment);
  }

  // TODO remove id when project and interventions are Entities
  public static async toDomainModel(raw: ICommentAttributes): Promise<Comment> {
    return Comment.create(
      {
        categoryId: raw.categoryId,
        text: raw.text,
        isPublic: raw.isPublic,
        isProjectVisible: raw.isProjectVisible,
        audit: await Audit.toDomainModel(raw.audit)
      },
      raw._id?.toString()
    ).getValue();
  }

  public static toPersistance(comment: Comment): ICommentAttributes {
    return {
      _id: toPersistanceMongoId(comment.id),
      categoryId: comment.categoryId,
      text: comment.text,
      isPublic: comment.isPublic,
      isProjectVisible: comment.isProjectVisible,
      audit: Audit.toPersistance(comment.audit)
    };
  }
}

export const isComment = (v: any): v is Comment => {
  return v instanceof Comment;
};

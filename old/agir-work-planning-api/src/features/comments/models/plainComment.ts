import { CommentCategory, IPlainComment } from '@villemontreal/agir-work-planning-lib/dist/src';
import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';

// tslint:disable:no-empty-interface
export interface IPlainCommentProps extends IPlainComment {}

export class PlainComment<P extends IPlainCommentProps> extends AggregateRoot<P> {
  public static create(props: IPlainCommentProps): Result<PlainComment<IPlainCommentProps>> {
    const guardPlain = this.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainComment<IPlainCommentProps>>(guard);
    }
    const plainComment = new PlainComment(props);
    return Result.ok<PlainComment<IPlainCommentProps>>(plainComment);
  }

  public static guard(props: IPlainCommentProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.categoryId,
        argumentName: 'categoryId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(CommentCategory)
      },
      {
        argument: props.text,
        argumentName: 'text',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.isPublic,
        argumentName: 'isPublic',
        guardType: [GuardType.IS_BOOLEAN]
      },
      {
        argument: props.isProjectVisible,
        argumentName: 'isProjectVisible',
        guardType: [GuardType.IS_BOOLEAN]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  constructor(props: P, id: string = null) {
    super(props, id);
  }

  public get categoryId(): string {
    return this.props.categoryId;
  }

  public get text(): string {
    return this.props.text;
  }

  public get isPublic(): boolean {
    return this.props.isPublic;
  }

  public get isProjectVisible(): boolean {
    return this.props.isProjectVisible;
  }

  public equals(otherComment: PlainComment<any>): boolean {
    return super.equals(otherComment) && this.innerEquals(otherComment);
  }

  private innerEquals(otherComment: PlainComment<any>): boolean {
    return this.categoryId === otherComment.categoryId && this.text === otherComment.text;
  }
}

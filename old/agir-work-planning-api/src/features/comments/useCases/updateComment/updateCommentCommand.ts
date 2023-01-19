import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IUpsertCommentCommandProps, UpsertCommentCommand } from '../upsertComment/upsertCommentCommand';

export interface IUpdateCommentCommandProps extends IUpsertCommentCommandProps {
  commentId: string;
}
export class UpdateCommentCommand<P extends IUpdateCommentCommandProps> extends UpsertCommentCommand<P> {
  public static create(
    props: IUpdateCommentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<UpdateCommentCommand<any>> {
    const guard = this.guard(props, entityIdGuardType);
    if (!guard.succeeded) {
      return Result.fail<UpdateCommentCommand<any>>(guard);
    }
    const updateCommentCommand = new UpdateCommentCommand(props, props.id);
    return Result.ok<UpdateCommentCommand<IUpdateCommentCommandProps>>(updateCommentCommand);
  }

  public static guard(
    props: IUpdateCommentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    const guardCommentId = Guard.guard({
      argument: props.commentId,
      argumentName: 'commentId',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, GuardType.VALID_UUID]
    });
    return Guard.combine([guardCommentId, UpsertCommentCommand.guard(props, entityIdGuardType)]);
  }

  public get commentId(): string {
    return this.props.commentId;
  }
}

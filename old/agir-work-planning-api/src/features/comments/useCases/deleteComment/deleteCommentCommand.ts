import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export interface IDeleteCommentCommandProps extends IByIdCommandProps {
  commentId: string;
}

export class DeleteCommentCommand extends ByIdCommand<IDeleteCommentCommandProps> {
  public static create(
    props: IDeleteCommentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<DeleteCommentCommand> {
    const guard = this.guard(props, entityIdGuardType);
    if (!guard.succeeded) {
      return Result.fail<DeleteCommentCommand>(guard);
    }
    const deleteCommentCommand = new DeleteCommentCommand(props);
    return Result.ok<DeleteCommentCommand>(deleteCommentCommand);
  }

  public static guard(
    props: IDeleteCommentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    const guardBulk = Guard.guardBulk([
      {
        argument: props.id,
        argumentName: 'id',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, entityIdGuardType]
      },
      {
        argument: props.commentId,
        argumentName: 'commentId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, GuardType.VALID_UUID]
      }
    ]);

    return Guard.combine(guardBulk);
  }

  public get commentId(): string {
    return this.props.commentId;
  }
}

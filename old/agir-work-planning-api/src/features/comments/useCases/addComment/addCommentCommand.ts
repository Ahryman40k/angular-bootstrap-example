import { GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { PlainComment } from '../../models/plainComment';
import { IUpsertCommentCommandProps, UpsertCommentCommand } from '../upsertComment/upsertCommentCommand';

// tslint:disable:next-line no-empty-interface
export interface IAddCommentCommandProps extends IUpsertCommentCommandProps {}

export class AddCommentCommand<P extends IAddCommentCommandProps> extends PlainComment<P> {
  public static create(
    props: IAddCommentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<AddCommentCommand<any>> {
    const guard = UpsertCommentCommand.guard(props, entityIdGuardType);
    if (!guard.succeeded) {
      return Result.fail<AddCommentCommand<any>>(guard);
    }
    const addCommentCommand = new AddCommentCommand(props, props.id);
    return Result.ok<AddCommentCommand<IAddCommentCommandProps>>(addCommentCommand);
  }
}

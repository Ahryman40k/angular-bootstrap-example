import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { IPlainCommentProps, PlainComment } from '../../models/plainComment';

export interface IUpsertCommentCommandProps extends IPlainCommentProps {
  id: string;
}

export abstract class UpsertCommentCommand<P extends IUpsertCommentCommandProps> extends PlainComment<P> {
  public static guard(
    props: IUpsertCommentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    const guardEntityId: IGuardResult = Guard.guard({
      argument: props.id,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, entityIdGuardType]
    });

    return Guard.combine([guardEntityId, PlainComment.guard(props)]);
  }

  public get id(): string {
    return this.props.id;
  }
}

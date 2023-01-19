import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IUpsertDocumentCommandProps, UpsertDocumentCommand } from '../upsertDocument/upsertDocumentCommand';

export interface IUpdateDocumentCommandProps extends IUpsertDocumentCommandProps {
  documentId: string;
}
export class UpdateDocumentCommand<P extends IUpdateDocumentCommandProps> extends UpsertDocumentCommand<P> {
  public static create(
    props: IUpdateDocumentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<UpdateDocumentCommand<any>> {
    const guard = this.guard(props, entityIdGuardType);
    if (!guard.succeeded) {
      return Result.fail<UpdateDocumentCommand<any>>(guard);
    }
    const updateDocumentCommand = new UpdateDocumentCommand(props, props.id);
    return Result.ok<UpdateDocumentCommand<IUpdateDocumentCommandProps>>(updateDocumentCommand);
  }

  public static guard(
    props: IUpdateDocumentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    const guardDocumentId = Guard.guard({
      argument: props.documentId,
      argumentName: 'documentId',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, GuardType.VALID_UUID]
    });
    return Guard.combine([guardDocumentId, UpsertDocumentCommand.guard(props, entityIdGuardType)]);
  }

  public get documentId(): string {
    return this.props.documentId;
  }
}

export const isUpdateDocumentCmd = (v: any): v is UpdateDocumentCommand<IUpdateDocumentCommandProps> => {
  return v instanceof UpdateDocumentCommand;
};

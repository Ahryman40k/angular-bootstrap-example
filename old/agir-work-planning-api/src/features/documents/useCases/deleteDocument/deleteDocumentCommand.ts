import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export interface IDeleteDocumentCommandProps extends IByIdCommandProps {
  documentId: string;
}

export class DeleteDocumentCommand extends ByIdCommand<IDeleteDocumentCommandProps> {
  public static create(
    props: IDeleteDocumentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<DeleteDocumentCommand> {
    const guard = this.guard(props, entityIdGuardType);
    if (!guard.succeeded) {
      return Result.fail<DeleteDocumentCommand>(guard);
    }
    const deleteDocumentCommand = new DeleteDocumentCommand(props);
    return Result.ok<DeleteDocumentCommand>(deleteDocumentCommand);
  }

  public static guard(
    props: IDeleteDocumentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    const guardBulk = Guard.guardBulk([
      {
        argument: props.documentId,
        argumentName: 'documentId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, GuardType.VALID_UUID]
      }
    ]);

    return Guard.combine([ByIdCommand.guard(props, entityIdGuardType), ...guardBulk]);
  }

  public get documentId(): string {
    return this.props.documentId;
  }
}

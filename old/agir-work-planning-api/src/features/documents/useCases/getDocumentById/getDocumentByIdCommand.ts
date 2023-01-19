import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export interface IGetDocumentByIdCommandProps extends IByIdCommandProps {
  documentId: string;
}

export class GetDocumentByIdCommand<P extends IGetDocumentByIdCommandProps> extends ByIdCommand<P> {
  public static create(
    props: IGetDocumentByIdCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<GetDocumentByIdCommand<IGetDocumentByIdCommandProps>> {
    const guardResult = this.guard(props, entityIdGuardType);
    if (!guardResult.succeeded) {
      return Result.fail<GetDocumentByIdCommand<IGetDocumentByIdCommandProps>>(guardResult);
    }

    const byProjectIdsCommand = new GetDocumentByIdCommand(props);
    return Result.ok<GetDocumentByIdCommand<IGetDocumentByIdCommandProps>>(byProjectIdsCommand);
  }

  public static guard(
    props: IGetDocumentByIdCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    const guardBase = ByIdCommand.guard(props, entityIdGuardType);
    const guardDocumentId = Guard.guard({
      argument: props.documentId,
      argumentName: `documentId`,
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
    });
    return Guard.combine([guardBase, guardDocumentId]);
  }

  public get documentId(): string {
    return this.props.documentId;
  }
}

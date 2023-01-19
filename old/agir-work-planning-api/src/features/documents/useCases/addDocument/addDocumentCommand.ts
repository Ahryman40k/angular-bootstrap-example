import { ImportFileCommand } from '../../../../shared/domain/useCases/importFileCommand';
import { Guard, GuardType, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IUpsertDocumentCommandProps, UpsertDocumentCommand } from '../upsertDocument/upsertDocumentCommand';

// tslint:disable:next-line no-empty-interface
export interface IAddDocumentCommandProps extends IUpsertDocumentCommandProps {}

export class AddDocumentCommand<P extends IAddDocumentCommandProps> extends UpsertDocumentCommand<P> {
  public static create(
    props: IAddDocumentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): Result<AddDocumentCommand<any>> {
    const guard = this.guard(props, entityIdGuardType);
    if (!guard.succeeded) {
      return Result.fail<AddDocumentCommand<any>>(guard);
    }
    const addDocumentCommand = new AddDocumentCommand(props, props.id);
    return Result.ok<AddDocumentCommand<IAddDocumentCommandProps>>(addDocumentCommand);
  }

  public static guard(
    props: IAddDocumentCommandProps,
    entityIdGuardType: GuardType = GuardType.VALID_UUID
  ): IGuardResult {
    return Guard.combine([ImportFileCommand.guard(props), UpsertDocumentCommand.guard(props, entityIdGuardType)]);
  }
}

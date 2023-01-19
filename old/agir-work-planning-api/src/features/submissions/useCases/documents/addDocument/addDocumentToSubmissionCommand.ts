import { Guard, GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  AddDocumentCommand,
  IAddDocumentCommandProps
} from '../../../../documents/useCases/addDocument/addDocumentCommand';

// tslint:disable:next-line no-empty-interface
export interface IAddDocumentToSubmissionCommandProps extends IAddDocumentCommandProps {}

export class AddDocumentToSubmissionCommand extends AddDocumentCommand<IAddDocumentToSubmissionCommandProps> {
  public static create(props: IAddDocumentToSubmissionCommandProps): Result<AddDocumentToSubmissionCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AddDocumentToSubmissionCommand>(guard);
    }
    const addDocumentCommand = new AddDocumentToSubmissionCommand(props, props.id);
    return Result.ok<AddDocumentToSubmissionCommand>(addDocumentCommand);
  }

  public static guard(props: IAddDocumentToSubmissionCommandProps): IGuardResult {
    return Guard.combine([AddDocumentCommand.guard(props, GuardType.VALID_SUBMISSION_NUMBER)]);
  }
}

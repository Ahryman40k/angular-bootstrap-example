import { Guard, GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IPlainDocumentInterventionProps,
  PlainDocumentIntervention
} from '../../../../documents/models/plainDocumentIntervention';
import {
  AddDocumentCommand,
  IAddDocumentCommandProps
} from '../../../../documents/useCases/addDocument/addDocumentCommand';

// tslint:disable:next-line no-empty-interface
export interface IAddDocumentToInterventionCommandProps
  extends IAddDocumentCommandProps,
    IPlainDocumentInterventionProps {}

export class AddDocumentToInterventionCommand<
  P extends IAddDocumentToInterventionCommandProps
> extends AddDocumentCommand<P> {
  public static create(props: IAddDocumentToInterventionCommandProps): Result<AddDocumentToInterventionCommand<any>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<AddDocumentToInterventionCommand<any>>(guard);
    }
    const addDocumentCommand = new AddDocumentToInterventionCommand(props, props.id);
    return Result.ok<AddDocumentToInterventionCommand<IAddDocumentToInterventionCommandProps>>(addDocumentCommand);
  }

  public static guard(props: IAddDocumentToInterventionCommandProps): IGuardResult {
    return Guard.combine([
      PlainDocumentIntervention.guardIsProjectVisible(props),
      AddDocumentCommand.guard(props, GuardType.VALID_INTERVENTION_ID)
    ]);
  }

  public get isProjectVisible(): boolean {
    return this.props.isProjectVisible;
  }
}

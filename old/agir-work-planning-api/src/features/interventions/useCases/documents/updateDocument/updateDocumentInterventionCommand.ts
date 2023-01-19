import { Guard, GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  IPlainDocumentInterventionProps,
  PlainDocumentIntervention
} from '../../../../documents/models/plainDocumentIntervention';
import {
  IUpdateDocumentCommandProps,
  UpdateDocumentCommand
} from '../../../../documents/useCases/updateDocument/updateDocumentCommand';

// tslint:disable:next-line no-empty-interface
export interface IUpdateDocumentInterventionCommandProps
  extends IUpdateDocumentCommandProps,
    IPlainDocumentInterventionProps {}

export class UpdateDocumentInterventionCommand<
  P extends IUpdateDocumentInterventionCommandProps
> extends UpdateDocumentCommand<P> {
  public static create(props: IUpdateDocumentInterventionCommandProps): Result<UpdateDocumentInterventionCommand<any>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<UpdateDocumentInterventionCommand<any>>(guard);
    }
    const updateDocumentCommand = new UpdateDocumentInterventionCommand(props, props.id);
    return Result.ok<UpdateDocumentInterventionCommand<IUpdateDocumentInterventionCommandProps>>(updateDocumentCommand);
  }

  public static guard(props: IUpdateDocumentInterventionCommandProps): IGuardResult {
    return Guard.combine([
      PlainDocumentIntervention.guardIsProjectVisible(props),
      UpdateDocumentCommand.guard(props, GuardType.VALID_INTERVENTION_ID)
    ]);
  }

  public get isProjectVisible(): boolean {
    return this.props.isProjectVisible;
  }
}

export const isUpdateDocumentInterventionCmd = (v: any): v is UpdateDocumentCommand<IUpdateDocumentCommandProps> => {
  return v instanceof UpdateDocumentInterventionCommand;
};

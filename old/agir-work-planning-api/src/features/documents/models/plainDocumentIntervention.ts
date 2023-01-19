import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { parseBooleanKeys } from '../../../utils/booleanUtils';
import { IPlainDocumentProps, PlainDocument } from './plainDocument';

// tslint:disable:no-empty-interface
export interface IPlainDocumentInterventionProps extends IPlainDocumentProps {
  isProjectVisible: boolean;
}

export class PlainDocumentIntervention<P extends IPlainDocumentInterventionProps> extends PlainDocument<P> {
  public static create(
    props: IPlainDocumentInterventionProps
  ): Result<PlainDocumentIntervention<IPlainDocumentInterventionProps>> {
    const guardPlain = this.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainDocumentIntervention<IPlainDocumentInterventionProps>>(guard);
    }
    const plainDocument = new PlainDocumentIntervention(props);
    return Result.ok<PlainDocumentIntervention<IPlainDocumentInterventionProps>>(plainDocument);
  }

  protected static guard(props: IPlainDocumentInterventionProps): IGuardResult {
    return Guard.combine([PlainDocument.guard(props), this.guardIsProjectVisible(props)]);
  }

  public static guardIsProjectVisible(props: any): IGuardResult {
    // transtype boolean
    parseBooleanKeys(props, ['isProjectVisible']);
    return Guard.guard({
      argument: props.isProjectVisible,
      argumentName: 'isProjectVisible',
      guardType: [GuardType.IS_BOOLEAN]
    });
  }

  public get isProjectVisible(): boolean {
    return this.props.isProjectVisible;
  }
}

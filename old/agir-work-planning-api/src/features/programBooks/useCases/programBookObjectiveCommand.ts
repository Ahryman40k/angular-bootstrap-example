import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { IPlainObjectiveProps, PlainObjective } from '../models/plainObjective';

// tslint:disable:no-empty-interface
export interface IObjectiveCommandProps extends IPlainObjectiveProps {
  programBookId: string;
}

export class ObjectiveCommand<P extends IObjectiveCommandProps> extends PlainObjective<P> {
  public static guard(props: IObjectiveCommandProps): IGuardResult {
    const guardProgramBookId = Guard.guard({
      argument: props.programBookId,
      argumentName: 'programBookId',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
    });
    const guardBase = PlainObjective.guard(props);
    return Guard.combine([guardBase, guardProgramBookId]);
  }

  public get programBookId(): string {
    return this.props.programBookId;
  }
}

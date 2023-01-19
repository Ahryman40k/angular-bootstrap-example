import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IObjectiveCommandProps, ObjectiveCommand } from '../programBookObjectiveCommand';

export interface IUpdateProgramBookObjectiveCommandProps extends IObjectiveCommandProps {
  objectiveId: string;
}

export class UpdateProgramBookObjectiveCommand extends ObjectiveCommand<IUpdateProgramBookObjectiveCommandProps> {
  public static create(props: IUpdateProgramBookObjectiveCommandProps): Result<UpdateProgramBookObjectiveCommand> {
    const guardObjectiveId = this.guard(props);
    const guardObjectiveCmd = ObjectiveCommand.guard(props);
    const guard = Guard.combine([guardObjectiveId, guardObjectiveCmd]);
    if (!guard.succeeded) {
      return Result.fail<UpdateProgramBookObjectiveCommand>(guard);
    }
    const objectiveUpdateCommand = new UpdateProgramBookObjectiveCommand(props, undefined);
    return Result.ok<UpdateProgramBookObjectiveCommand>(objectiveUpdateCommand);
  }

  public static guard(props: IUpdateProgramBookObjectiveCommandProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.objectiveId,
        argumentName: 'objectiveId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get objectiveId() {
    return this.props.objectiveId;
  }
}

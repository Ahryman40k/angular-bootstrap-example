import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export interface IDeleteProgramBookObjectiveCommandProps {
  programBookId: string;
  objectiveId: string;
}

export class DeleteProgramBookObjectiveCommand extends Command<IDeleteProgramBookObjectiveCommandProps> {
  public static create(props: IDeleteProgramBookObjectiveCommandProps): Result<DeleteProgramBookObjectiveCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<DeleteProgramBookObjectiveCommand>(guard);
    }
    const objectiveDeleteCommand = new DeleteProgramBookObjectiveCommand(props);
    return Result.ok<DeleteProgramBookObjectiveCommand>(objectiveDeleteCommand);
  }

  public static guard(props: IDeleteProgramBookObjectiveCommandProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.programBookId,
        argumentName: 'programBookId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      },
      {
        argument: props.objectiveId,
        argumentName: 'objectiveId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get programBookId() {
    return this.props.programBookId;
  }

  public get objectiveId() {
    return this.props.objectiveId;
  }
}

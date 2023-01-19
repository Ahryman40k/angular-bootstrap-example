import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export interface IProgramProjectCommandProps {
  programBookId: string;
  projectId: string;
}

export class ProgramProjectCommand extends Command<IProgramProjectCommandProps> {
  public static create(props: IProgramProjectCommandProps): Result<ProgramProjectCommand> {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.programBookId,
        argumentName: 'programBookId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      },
      {
        argument: props.projectId,
        argumentName: 'projectId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
      }
    ];

    const guard = Guard.combine([...Guard.guardBulk(guardBulk)]);
    if (!guard.succeeded) {
      return Result.fail<ProgramProjectCommand>(guard);
    }
    const programProjectCmd = new ProgramProjectCommand(props);
    return Result.ok<ProgramProjectCommand>(programProjectCmd);
  }

  public get programBookId(): string {
    return this.props.programBookId;
  }
  public get projectId(): string {
    return this.props.projectId;
  }
}

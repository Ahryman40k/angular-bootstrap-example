import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export interface ICalculatePriorityScenarioCommandProps {
  programBookId: string;
  priorityScenarioId: string;
}

export class CalculatePriorityScenarioCommand extends Command<ICalculatePriorityScenarioCommandProps> {
  public static create(props: ICalculatePriorityScenarioCommandProps): Result<CalculatePriorityScenarioCommand> {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.programBookId,
        argumentName: 'programBookId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      },
      {
        argument: props.priorityScenarioId,
        argumentName: 'priorityScenarioId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_UUID]
      }
    ];

    const guard = Guard.combine([...Guard.guardBulk(guardBulk)]);
    if (!guard.succeeded) {
      return Result.fail<CalculatePriorityScenarioCommand>(guard);
    }
    const calculatePriorityScenarioCommand = new CalculatePriorityScenarioCommand(props);
    return Result.ok<CalculatePriorityScenarioCommand>(calculatePriorityScenarioCommand);
  }

  public get programBookId(): string {
    return this.props.programBookId;
  }
  public get priorityScenarioId(): string {
    return this.props.priorityScenarioId;
  }
}

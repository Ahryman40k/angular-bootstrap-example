import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IPlainPriorityLevelProps } from '../../models/plainPriorityLevel';
import { PriorityLevel } from '../../models/priorityLevel';

export interface IUpdatePriorityLevelsCommandProps {
  programBookId: string;
  priorityScenarioId: string;
  priorityLevels: IPlainPriorityLevelProps[];
}

export class UpdatePriorityLevelsCommand extends Command<IUpdatePriorityLevelsCommandProps> {
  public static create(props: IUpdatePriorityLevelsCommandProps): Result<UpdatePriorityLevelsCommand> {
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
    const guardLevelUndefined = Guard.guard({
      argument: props.priorityLevels,
      argumentName: 'priorityLevels',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_ARRAY]
    });
    let guardLevels = [{ succeeded: true }];
    if (guardLevelUndefined.succeeded) {
      guardLevels = props.priorityLevels.map((level, index) => PriorityLevel.guard(level, `[${index}]`));
    }

    const guard = Guard.combine([...Guard.guardBulk(guardBulk), guardLevelUndefined, ...guardLevels]);
    if (!guard.succeeded) {
      return Result.fail<UpdatePriorityLevelsCommand>(guard);
    }
    const updatePriorityLevelsCommand = new UpdatePriorityLevelsCommand(props);
    return Result.ok<UpdatePriorityLevelsCommand>(updatePriorityLevelsCommand);
  }

  private readonly _priorityLevels: PriorityLevel[];
  constructor(props: IUpdatePriorityLevelsCommandProps) {
    super(props);
    this._priorityLevels = props.priorityLevels.map(level => PriorityLevel.create(level).getValue());
  }

  public get programBookId(): string {
    return this.props.programBookId;
  }

  public get priorityScenarioId(): string {
    return this.props.priorityScenarioId;
  }

  public get priorityLevels(): PriorityLevel[] {
    return this._priorityLevels;
  }
}

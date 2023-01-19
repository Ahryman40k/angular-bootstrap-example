import { IOrderedProjectsPaginatedSearchRequest } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IGetPriorityScenarioOrderedProjectsProps extends IOrderedProjectsPaginatedSearchRequest {
  programBookId: string;
  priorityScenarioId: string;
}

export class GetPriorityScenarioOrderedProjectsCommand extends Command<IGetPriorityScenarioOrderedProjectsProps> {
  public static create(
    props: IGetPriorityScenarioOrderedProjectsProps
  ): Result<GetPriorityScenarioOrderedProjectsCommand> {
    const guard = GetPriorityScenarioOrderedProjectsCommand.guard(props);
    if (!guard.succeeded) {
      return Result.fail<GetPriorityScenarioOrderedProjectsCommand>(guard);
    }

    const getCommand = new GetPriorityScenarioOrderedProjectsCommand(props);
    return Result.ok<GetPriorityScenarioOrderedProjectsCommand>(getCommand);
  }

  public static guard(props: IGetPriorityScenarioOrderedProjectsProps): IGuardResult {
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
      },
      {
        argument: props.projectLimit,
        argumentName: 'projectLimit',
        guardType: [GuardType.IS_POSITIVE_INTEGER]
      },
      {
        argument: props.projectOffset,
        argumentName: 'projectLimit',
        guardType: [GuardType.IS_ZERO_OR_POSITIVE_INTEGER]
      },
      {
        argument: props.projectOrderBy,
        argumentName: 'projectOrderBy',
        guardType: []
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public get programBookId(): string {
    return this.props.programBookId;
  }

  public get priorityScenarioId(): string {
    return this.props.priorityScenarioId;
  }

  public get projectLimit(): number {
    return +this.props.projectLimit;
  }

  public get projectOffset(): number {
    return +this.props.projectOffset;
  }

  public get projectOrderBy(): string {
    return this.props.projectOrderBy;
  }
}

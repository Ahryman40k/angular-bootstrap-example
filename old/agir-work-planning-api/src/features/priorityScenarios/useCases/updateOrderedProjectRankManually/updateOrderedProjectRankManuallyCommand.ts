import { Command } from '../../../../shared/domain/command';
import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { IProjectRankProps, ProjectRank } from '../../models/projectRank';

export interface IUpdateOrderedProjectRankManuallyCommandProps {
  programBookId: string;
  priorityScenarioId: string;
  projectId: string;
  projectRank: IProjectRankProps;
}

export class UpdateOrderedProjectRankManuallyCommand extends Command<IUpdateOrderedProjectRankManuallyCommandProps> {
  public static create(
    props: IUpdateOrderedProjectRankManuallyCommandProps
  ): Result<UpdateOrderedProjectRankManuallyCommand> {
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
        argument: props.projectId,
        argumentName: 'projectId',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
      }
    ];
    let guardProjectRank = Guard.guard({
      argument: props.projectRank,
      argumentName: 'projectRank',
      guardType: [GuardType.NULL_OR_UNDEFINED]
    });
    if (guardProjectRank.succeeded) {
      guardProjectRank = ProjectRank.guard(props.projectRank);
    }

    const guard = Guard.combine([...Guard.guardBulk(guardBulk), guardProjectRank]);
    if (!guard.succeeded) {
      return Result.fail<UpdateOrderedProjectRankManuallyCommand>(guard);
    }
    const updateOrderedProjectRankManually = new UpdateOrderedProjectRankManuallyCommand(props);
    return Result.ok<UpdateOrderedProjectRankManuallyCommand>(updateOrderedProjectRankManually);
  }

  private readonly _projectRank: ProjectRank;
  constructor(props: IUpdateOrderedProjectRankManuallyCommandProps) {
    super(props);
    this._projectRank = ProjectRank.create(props.projectRank).getValue();
  }

  public get programBookId(): string {
    return this.props.programBookId;
  }

  public get priorityScenarioId(): string {
    return this.props.priorityScenarioId;
  }

  public get projectId(): string {
    return this.props.projectId;
  }

  public get projectRank(): ProjectRank {
    return this._projectRank;
  }
}

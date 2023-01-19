import { Guard, GuardType } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { BaseSubmissionCommand, IBaseSubmissionCommandProps } from './baseSubmissionCommand';

// tslint:disable:no-empty-interface
export interface IProjectSubmissionProps extends IBaseSubmissionCommandProps {
  projectId: string;
}

export class ProjectSubmissionCommand extends BaseSubmissionCommand<IProjectSubmissionProps> {
  public static create(props: IProjectSubmissionProps): Result<ProjectSubmissionCommand> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProjectSubmissionCommand>(guard);
    }
    const projectSubmissionCommand = new ProjectSubmissionCommand(props);
    return Result.ok<ProjectSubmissionCommand>(projectSubmissionCommand);
  }

  public static guard(props: IProjectSubmissionProps) {
    const guardProjectId = Guard.guard({
      argument: props.projectId,
      argumentName: 'id',
      guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_PROJECT_ID]
    });
    return Guard.combine([BaseSubmissionCommand.guard(props), guardProjectId]);
  }

  public get projectId(): string {
    return this.props.projectId;
  }
}

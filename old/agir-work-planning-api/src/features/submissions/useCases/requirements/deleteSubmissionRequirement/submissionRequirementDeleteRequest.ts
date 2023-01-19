import { ByIdCommand, IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { Guard } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { BaseSubmissionCommand, IBaseSubmissionCommandProps } from '../../../models/baseSubmissionCommand';

export interface ISubmissionDeleteRequirementRequestProps extends IByIdCommandProps, IBaseSubmissionCommandProps {}

export class DeleteSubmissionRequirementCommand extends BaseSubmissionCommand<
  ISubmissionDeleteRequirementRequestProps
> {
  public static create(props: ISubmissionDeleteRequirementRequestProps): Result<DeleteSubmissionRequirementCommand> {
    const guard = Guard.combine([ByIdCommand.guard(props), BaseSubmissionCommand.guard(props)]);
    if (!guard.succeeded) {
      return Result.fail<DeleteSubmissionRequirementCommand>(guard);
    }
    const deleteSubmissionRequirementCommand = new DeleteSubmissionRequirementCommand(props);
    return Result.ok<DeleteSubmissionRequirementCommand>(deleteSubmissionRequirementCommand);
  }

  public get id(): string {
    return this.props.id;
  }
}

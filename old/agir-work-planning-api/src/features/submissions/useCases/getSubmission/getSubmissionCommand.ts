import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { GuardType } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';

export class GetSubmissionCommand extends ByIdCommand<IByIdCommandProps> {
  public static create(props: IByIdCommandProps): Result<GetSubmissionCommand> {
    const guard = ByIdCommand.guard(props, GuardType.VALID_SUBMISSION_NUMBER);
    if (!guard.succeeded) {
      return Result.fail<GetSubmissionCommand>(guard);
    }

    const getSubmissionCommand = new GetSubmissionCommand(props);
    return Result.ok<GetSubmissionCommand>(getSubmissionCommand);
  }
}

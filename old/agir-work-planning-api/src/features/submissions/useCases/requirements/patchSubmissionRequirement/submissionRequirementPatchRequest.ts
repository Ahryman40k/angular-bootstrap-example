import { ByIdCommand, IByIdCommandProps } from '../../../../../shared/domain/useCases/byIdCommand';
import { Guard, GuardType, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { BaseSubmissionCommand, IBaseSubmissionCommandProps } from '../../../models/baseSubmissionCommand';

export interface ISubmissionRequirementPatchRequestProps extends IByIdCommandProps, IBaseSubmissionCommandProps {
  isDeprecated: boolean;
}

export class SubmissionRequirementPatchRequest extends BaseSubmissionCommand<ISubmissionRequirementPatchRequestProps> {
  public static guard(props: ISubmissionRequirementPatchRequestProps): IGuardResult {
    return Guard.guard({
      argument: props.isDeprecated,
      argumentName: `isDeprecated`,
      guardType: [GuardType.IS_BOOLEAN]
    });
  }

  public static create(props: ISubmissionRequirementPatchRequestProps): Result<SubmissionRequirementPatchRequest> {
    const guard = Guard.combine([ByIdCommand.guard(props), BaseSubmissionCommand.guard(props), this.guard(props)]);
    if (!guard.succeeded) {
      return Result.fail<SubmissionRequirementPatchRequest>(guard);
    }
    const patchSubmissionCommand = new SubmissionRequirementPatchRequest(props);
    return Result.ok<SubmissionRequirementPatchRequest>(patchSubmissionCommand);
  }

  public get id(): string {
    return this.props.id;
  }

  public get isDeprecated(): boolean {
    return this.props.isDeprecated;
  }
}

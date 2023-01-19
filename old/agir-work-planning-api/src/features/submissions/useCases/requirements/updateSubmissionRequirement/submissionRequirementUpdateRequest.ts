import { ByIdCommand } from '../../../../../shared/domain/useCases/byIdCommand';
import { Guard, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import {
  ISubmissionRequirementCreateRequestProps,
  SubmissionRequirementCreateRequest
} from '../addSubmissionRequirement/submissionRequirementCreateRequest';

export interface ISubmissionRequirementUpdateRequestProps extends ISubmissionRequirementCreateRequestProps {
  id: string;
}

export class SubmissionRequirementUpdateRequest extends SubmissionRequirementCreateRequest<
  ISubmissionRequirementUpdateRequestProps
> {
  public static guard(props: ISubmissionRequirementUpdateRequestProps): IGuardResult {
    return Guard.combine([ByIdCommand.guard(props), SubmissionRequirementCreateRequest.guard(props)]);
  }

  public static create(props: ISubmissionRequirementUpdateRequestProps): Result<SubmissionRequirementUpdateRequest> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<SubmissionRequirementUpdateRequest>(guard);
    }
    const projectSubmissionCommand = new SubmissionRequirementUpdateRequest(props, props.id);
    return Result.ok<SubmissionRequirementUpdateRequest>(projectSubmissionCommand);
  }

  public get id(): string {
    return this.props.id;
  }
}

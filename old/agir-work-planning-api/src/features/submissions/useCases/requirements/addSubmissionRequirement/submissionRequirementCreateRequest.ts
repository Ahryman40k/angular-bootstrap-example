import { Guard, IGuardResult } from '../../../../../shared/logic/guard';
import { Result } from '../../../../../shared/logic/result';
import { BaseSubmissionCommand, IBaseSubmissionCommandProps } from '../../../models/baseSubmissionCommand';
import {
  IPlainSubmissionRequirementProps,
  PlainSubmissionRequirement
} from '../../../models/requirements/plainSubmissionRequirement';

// tslint:disable:no-empty-interface
export interface ISubmissionRequirementCreateRequestProps
  extends IPlainSubmissionRequirementProps,
    IBaseSubmissionCommandProps {}

export class SubmissionRequirementCreateRequest<
  P extends ISubmissionRequirementCreateRequestProps
> extends PlainSubmissionRequirement<P> {
  public static create(
    props: ISubmissionRequirementCreateRequestProps
  ): Result<SubmissionRequirementCreateRequest<ISubmissionRequirementCreateRequestProps>> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<SubmissionRequirementCreateRequest<ISubmissionRequirementCreateRequestProps>>(guard);
    }
    const projectSubmissionCommand = new SubmissionRequirementCreateRequest(props, undefined);
    return Result.ok<SubmissionRequirementCreateRequest<ISubmissionRequirementCreateRequestProps>>(
      projectSubmissionCommand
    );
  }

  public static guard(props: ISubmissionRequirementCreateRequestProps): IGuardResult {
    return Guard.combine([BaseSubmissionCommand.guard(props), PlainSubmissionRequirement.guard(props)]);
  }

  public get submissionNumber(): string {
    return this.props.submissionNumber;
  }
}

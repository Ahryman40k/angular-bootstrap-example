import { SubmissionProgressStatus } from '@villemontreal/agir-work-planning-lib';

import { Guard, GuardType, IGuardArgument } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { enumValues } from '../../../../utils/enumUtils';
import { BaseSubmissionCommand, IBaseSubmissionCommandProps } from '../../models/baseSubmissionCommand';

// tslint:disable:no-empty-interface
export interface ISubmissionPatchRequestProps extends IBaseSubmissionCommandProps {
  status?: string;
  progressStatus?: SubmissionProgressStatus;
  comment?: string;
  progressStatusChangeDate?: string;
}

export class SubmissionPatchRequest extends BaseSubmissionCommand<ISubmissionPatchRequestProps> {
  public static create(props: ISubmissionPatchRequestProps): Result<SubmissionPatchRequest> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<SubmissionPatchRequest>(guard);
    }
    const submissionPatchRequest = new SubmissionPatchRequest(props);
    return Result.ok<SubmissionPatchRequest>(submissionPatchRequest);
  }

  public static guard(props: ISubmissionPatchRequestProps) {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.progressStatus,
        argumentName: 'progressStatus',
        guardType: [GuardType.EMPTY_STRING, GuardType.IS_ONE_OF],
        values: enumValues(SubmissionProgressStatus)
      },
      {
        argument: props.comment,
        argumentName: 'comment',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.progressStatusChangeDate,
        argumentName: 'progressStatusChangeDate',
        guardType: [GuardType.VALID_DATE]
      },
      {
        argument: props,
        argumentName: 'input',
        guardType: [GuardType.AT_LEAST_ONE],
        values: ['status', 'progressStatus']
      },
      {
        argument: props,
        argumentName: 'input',
        guardType: [GuardType.IS_CONDITIONAL_MANDATORY],
        values: ['progressStatus', 'progressStatusChangeDate']
      }
    ];
    return Guard.combine([BaseSubmissionCommand.guard(props), ...Guard.guardBulk(guardBulk)]);
  }

  public get status(): string {
    return this.props.status;
  }

  public get progressStatus(): SubmissionProgressStatus {
    return this.props.progressStatus;
  }

  public get comment(): string {
    return this.props.comment;
  }

  public get progressStatusChangeDate(): Date {
    return new Date(this.props.progressStatusChangeDate);
  }
}

import { SubmissionProgressStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';

import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { documentableAuditable } from '../../../shared/mixins/mixins';
import { enumValues } from '../../../utils/enumUtils';
import { IAuditableProps } from '../../audit/auditable';
import { IDocumentableProps } from '../../documents/models/documentable';
import { IProgressHistoryItemProps, isProgressHistoryItem, ProgressHistoryItem } from './progressHistoryItem';
import { isRequirementItem, SubmissionRequirement } from './requirements/submissionRequirement';
import { isStatusHistoryItem, StatusHistoryItem } from './statusHistoryItem';
import { ISubmissionCreateRequestProps, SubmissionCreateRequest } from './submissionCreateRequest';

export const DRM_NUMBER_REGEX = /^[5-9]{1}\d{3}$/;

export const INVALID_SUBMISSION_PROGRESS_STATUS = [
  SubmissionProgressStatus.REALIZATION,
  SubmissionProgressStatus.CLOSING
];
export interface ISubmissionProps extends ISubmissionCreateRequestProps, IAuditableProps, IDocumentableProps {
  submissionNumber: string;
  drmNumber: string;
  status: string;
  progressStatus: SubmissionProgressStatus;
  progressHistory: IProgressHistoryItemProps[] | ProgressHistoryItem[];
  requirements?: SubmissionRequirement[];
  statusHistory?: StatusHistoryItem[];
}

export class Submission extends documentableAuditable(SubmissionCreateRequest)<ISubmissionProps> {
  public static create(props: ISubmissionProps): Result<Submission> {
    const guard = this.guard(props);
    if (!guard.succeeded) {
      return Result.fail<Submission>(guard);
    }
    const submission = new Submission(props, props.submissionNumber);
    return Result.ok<Submission>(submission);
  }

  public static guard(props: ISubmissionProps): IGuardResult {
    const guardCreateRequest = SubmissionCreateRequest.guard(props);
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.submissionNumber,
        argumentName: 'submissionNumber',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.drmNumber,
        argumentName: 'drmNumber',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.status,
        argumentName: 'status',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING]
      },
      {
        argument: props.progressStatus,
        argumentName: 'progressStatus',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.EMPTY_STRING, GuardType.IS_ONE_OF],
        values: enumValues(SubmissionProgressStatus)
      }
    ];

    let guardProgressHistory: IGuardResult[] = [{ succeeded: true }];
    if (props.progressHistory) {
      guardProgressHistory = props.progressHistory
        .filter(p => !isProgressHistoryItem(p))
        .map((h, index) => ProgressHistoryItem.guard(h, `progressHistory[${index}].`));
    }

    let guardStatusHistory: IGuardResult[] = [{ succeeded: true }];
    if (props.statusHistory) {
      guardStatusHistory = props.statusHistory
        .filter(p => !isStatusHistoryItem(p))
        .map((h, index) => StatusHistoryItem.guard(h, `statusHistory[${index}].`));
    }

    return Guard.combine([
      guardCreateRequest,
      ...Guard.guardBulk(guardBulk),
      ...guardProgressHistory,
      ...guardStatusHistory
    ]);
  }

  private readonly _progressHistory: ProgressHistoryItem[] = [];
  private readonly _requirements: SubmissionRequirement[] = [];
  private readonly _statusHistory: StatusHistoryItem[] = [];
  constructor(props: ISubmissionProps, id?: string) {
    super(props, id);
    if (!isEmpty(props.progressHistory)) {
      for (const progressHistory of props.progressHistory) {
        if (!isProgressHistoryItem(progressHistory)) {
          this._progressHistory.push(ProgressHistoryItem.create(progressHistory).getValue());
        } else {
          this._progressHistory.push(progressHistory);
        }
      }
    }

    if (!isEmpty(props.requirements)) {
      for (const requirement of props.requirements) {
        if (!isRequirementItem(requirement)) {
          this._requirements.push(SubmissionRequirement.create(requirement).getValue());
        } else {
          this._requirements.push(requirement);
        }
      }
    }

    if (!isEmpty(props.statusHistory)) {
      for (const statusHistory of props.statusHistory) {
        if (!isStatusHistoryItem(statusHistory)) {
          this._statusHistory.push(StatusHistoryItem.create(statusHistory).getValue());
        } else {
          this._statusHistory.push(statusHistory);
        }
      }
    }
  }

  public get submissionNumber(): string {
    return this.props.submissionNumber;
  }

  public get drmNumber(): string {
    return this.props.drmNumber;
  }

  public get status(): string {
    return this.props.status;
  }

  public get progressStatus(): SubmissionProgressStatus {
    return this.props.progressStatus;
  }

  public get progressHistory(): ProgressHistoryItem[] {
    return this._progressHistory;
  }

  public get requirements(): SubmissionRequirement[] {
    return this._requirements;
  }

  public get statusHistory(): StatusHistoryItem[] {
    return this._statusHistory;
  }

  public addOrReplaceRequirement(requirement: SubmissionRequirement): void {
    const requirementIndex = this.requirements.findIndex(i => i.id === requirement.id);
    if (requirementIndex > -1) {
      this.requirements.splice(requirementIndex, 1, requirement);
    } else {
      this.requirements.push(requirement);
    }
  }

  public addStatusHistory(statusHistory: StatusHistoryItem): void {
    this.statusHistory.push(statusHistory);
  }
}

export const isSubmission = (v: any): v is Submission => {
  return v instanceof Submission;
};

import { SubmissionProgressStatus, SubmissionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FindOptions, ICriterias, IFindOptionsProps } from '../../../shared/findOptions/findOptions';
import { Order, OrderByCriteria } from '../../../shared/findOptions/orderByCriteria';
import { Guard, GuardType, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { DRM_NUMBER_REGEX } from './submission';

export interface ISubmissionCriterias extends ICriterias {
  submissionNumber?: string | string[];
  drmNumber?: string | string[];
  programBookId?: string | string[];
  projectIds?: string | string[];
  status?: string | string[];
  progressStatus?: string | string[];
}

export interface ISubmissionFindOptionsProps extends IFindOptionsProps {
  criterias: ISubmissionCriterias;
}

export class SubmissionFindOptions extends FindOptions<ISubmissionFindOptionsProps> {
  public static create(props: ISubmissionFindOptionsProps): Result<SubmissionFindOptions> {
    const guard = SubmissionFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<SubmissionFindOptions>(guard);
    }
    const submissionFindOptions = new SubmissionFindOptions(props);
    return Result.ok<SubmissionFindOptions>(submissionFindOptions);
  }

  public static guard(props: ISubmissionFindOptionsProps): IGuardResult {
    return Guard.combine([FindOptions.guard(props), this.guardCriterias(props)]);
  }

  private static guardCriterias(props: ISubmissionFindOptionsProps): IGuardResult {
    if (props.criterias) {
      // convert all criterias to arrays
      for (const key of Object.keys(props.criterias)) {
        if (typeof props.criterias[key] === 'string') {
          props.criterias[key] = props.criterias[key].split(',');
        }
      }
      let guardSubmissionNumbers: IGuardResult[] = [{ succeeded: true }];
      if (props.criterias.submissionNumber) {
        guardSubmissionNumbers = (props.criterias.submissionNumber as string[]).map((subNumber, index) =>
          Guard.guard({
            argument: subNumber,
            argumentName: `submissionNumber[${index}]`,
            guardType: [GuardType.VALID_SUBMISSION_NUMBER]
          })
        );
      }
      let guardDrmNumbers: IGuardResult[] = [{ succeeded: true }];
      if (props.criterias.drmNumber) {
        guardDrmNumbers = (props.criterias.drmNumber as string[]).map((drmNumber, index) =>
          Guard.guard({
            argument: drmNumber,
            argumentName: `drmNumber[${index}]`,
            guardType: [GuardType.VALID_REGEX],
            values: [DRM_NUMBER_REGEX]
          })
        );
      }
      let guardProgramBookIds: IGuardResult[] = [{ succeeded: true }];
      if (props.criterias.programBookId) {
        guardProgramBookIds = (props.criterias.programBookId as string[]).map((pbId, index) =>
          Guard.guard({
            argument: pbId,
            argumentName: `programBookId[${index}]`,
            guardType: [GuardType.VALID_UUID]
          })
        );
      }
      let guardProjectIds: IGuardResult[] = [{ succeeded: true }];
      if (props.criterias.projectIds) {
        guardProjectIds = (props.criterias.projectIds as string[]).map((pId, index) =>
          Guard.guard({
            argument: pId,
            argumentName: `projectIds[${index}]`,
            guardType: [GuardType.VALID_PROJECT_ID]
          })
        );
      }
      let guardStatus: IGuardResult[] = [{ succeeded: true }];
      if (props.criterias.status) {
        guardStatus = (props.criterias.status as string[]).map((status, index) =>
          Guard.guard({
            argument: status,
            argumentName: `status[${index}]`,
            guardType: [GuardType.IS_ONE_OF],
            values: [SubmissionStatus.VALID, SubmissionStatus.INVALID]
          })
        );
      }
      let guardProgressStatus: IGuardResult[] = [{ succeeded: true }];
      if (props.criterias.progressStatus) {
        guardProgressStatus = (props.criterias.progressStatus as string[]).map((progressStatus, index) =>
          Guard.guard({
            argument: progressStatus,
            argumentName: `progressStatus[${index}]`,
            guardType: [GuardType.IS_ONE_OF],
            values: enumValues(SubmissionProgressStatus)
          })
        );
      }
      return Guard.combine([
        ...guardSubmissionNumbers,
        ...guardDrmNumbers,
        ...guardProgramBookIds,
        ...guardProjectIds,
        ...guardStatus,
        ...guardProgressStatus
      ]);
    }
    return { succeeded: true };
  }

  constructor(props: ISubmissionFindOptionsProps) {
    super(props);
    if (!this.orderByCriterias.find(orderBy => orderBy.field === 'createdAt')) {
      this.orderByCriterias.push(
        OrderByCriteria.create({
          field: 'createdAt',
          order: Order.DESCENDING
        }).getValue()
      );
    }
  }
}

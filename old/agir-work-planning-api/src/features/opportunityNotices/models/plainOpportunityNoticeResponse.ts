import {
  IDate,
  IPlainOpportunityNoticeResponse,
  OpportunityNoticeResponsePlanningDecision as PlanningDecision,
  OpportunityNoticeResponseRequestorDecision as RequestorDecision
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { AggregateRoot } from '../../../shared/domain/aggregateRoot';
import { Guard, GuardType, IGuardArgument, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { enumValues } from '../../../utils/enumUtils';
import { MomentUtils } from '../../../utils/moment/momentUtils';

export type OpportunityNoticeResponseRequestorDecision = keyof typeof RequestorDecision;
export type OpportunityNoticeResponsePlanningDecision = keyof typeof PlanningDecision;

// tslint:disable:no-empty-interface
export interface IPlainOpportunityNoticeResponseProps extends IPlainOpportunityNoticeResponse {}

export class PlainOpportunityNoticeResponse<P extends IPlainOpportunityNoticeResponseProps> extends AggregateRoot<P> {
  public static create(
    props: IPlainOpportunityNoticeResponseProps
  ): Result<PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>> {
    if (!props) {
      return Result.fail<PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>>(`Empty body`);
    }
    const guardPlain = PlainOpportunityNoticeResponse.guard(props);
    const guard = Guard.combine([guardPlain]);
    if (!guard.succeeded) {
      return Result.fail<PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>>(guard);
    }
    const plainOpportunityNotice = new PlainOpportunityNoticeResponse(props, null);
    return Result.ok<PlainOpportunityNoticeResponse<IPlainOpportunityNoticeResponseProps>>(plainOpportunityNotice);
  }

  public get requestorDecision(): OpportunityNoticeResponseRequestorDecision {
    return this.props.requestorDecision;
  }

  public get requestorDecisionNote(): string {
    return this.props.requestorDecisionNote;
  }

  public get requestorDecisionDate(): IDate {
    return this.props.requestorDecisionDate;
  }

  public get planningDecision(): OpportunityNoticeResponsePlanningDecision {
    return this.props.planningDecision;
  }

  public get planningDecisionNote(): string {
    return this.props.planningDecisionNote;
  }

  public static guard(props: IPlainOpportunityNoticeResponseProps): IGuardResult {
    const guardBulk: IGuardArgument[] = [
      {
        argument: props.requestorDecision,
        argumentName: 'requestorDecision',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.IS_ONE_OF],
        values: enumValues(RequestorDecision)
      },
      {
        argument: props.requestorDecisionNote,
        argumentName: 'requestorDecisionNote',
        guardType: [GuardType.EMPTY_STRING]
      },
      {
        argument: props.requestorDecisionDate,
        argumentName: 'requestorDecisionDate',
        guardType: [GuardType.NULL_OR_UNDEFINED, GuardType.VALID_DATE, GuardType.IS_SAME_OR_BEFORE],
        values: [MomentUtils.now().toISOString()]
      },
      {
        argument: props.planningDecision,
        argumentName: 'planningDecision',
        guardType: [GuardType.IS_ONE_OF],
        values: enumValues(PlanningDecision)
      },
      {
        argument: props.planningDecisionNote,
        argumentName: 'planningDecisionNote',
        guardType: [GuardType.EMPTY_STRING]
      }
    ];
    return Guard.combine([...Guard.guardBulk(guardBulk)]);
  }

  public equals(otherOpportunityNotice: PlainOpportunityNoticeResponse<any>): boolean {
    return super.equals(otherOpportunityNotice) && this.innerEquals(otherOpportunityNotice);
  }

  private innerEquals(otherOpportunityNoticeNote: PlainOpportunityNoticeResponse<any>): boolean {
    return (
      this.requestorDecision === otherOpportunityNoticeNote.requestorDecision &&
      this.requestorDecisionNote === otherOpportunityNoticeNote.requestorDecisionNote &&
      this.requestorDecisionDate === otherOpportunityNoticeNote.requestorDecisionDate &&
      this.planningDecision === otherOpportunityNoticeNote.planningDecision &&
      this.planningDecisionNote === otherOpportunityNoticeNote.planningDecisionNote
    );
  }
}

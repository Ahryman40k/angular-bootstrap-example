import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { Audit } from '../../audit/audit';
import { Auditable, IAuditableProps } from '../../audit/auditable';
import { IOpportunityNoticeResponseAttributes } from '../mongo/opportunityNoticeSchema';
import {
  IPlainOpportunityNoticeResponseProps,
  OpportunityNoticeResponsePlanningDecision,
  OpportunityNoticeResponseRequestorDecision,
  PlainOpportunityNoticeResponse
} from './plainOpportunityNoticeResponse';

// tslint:disable:no-empty-interface
export interface IOpportunityNoticeResponseProps extends IPlainOpportunityNoticeResponseProps, IAuditableProps {}

export class OpportunityNoticeResponse extends Auditable(PlainOpportunityNoticeResponse)<
  IOpportunityNoticeResponseProps
> {
  public static create(props: IOpportunityNoticeResponseProps, id?: string): Result<OpportunityNoticeResponse> {
    const guardPlain = PlainOpportunityNoticeResponse.guard(props);
    const guardAudit = Audit.guard(props.audit);
    const guardResult = Guard.combine([guardPlain, guardAudit]);
    if (!guardResult.succeeded) {
      return Result.fail<OpportunityNoticeResponse>(guardResult);
    }
    const opportunityNoticeResponse = new OpportunityNoticeResponse(props, id);
    return Result.ok<OpportunityNoticeResponse>(opportunityNoticeResponse);
  }

  public static async toDomainModel(raw: IOpportunityNoticeResponseAttributes): Promise<OpportunityNoticeResponse> {
    const responseProps: IOpportunityNoticeResponseProps = {
      requestorDecision: raw.requestorDecision as OpportunityNoticeResponseRequestorDecision,
      requestorDecisionNote: raw.requestorDecisionNote,
      requestorDecisionDate: raw.requestorDecisionDate,
      planningDecision: raw.planningDecision as OpportunityNoticeResponsePlanningDecision,
      planningDecisionNote: raw.planningDecisionNote,
      audit: await Audit.toDomainModel(raw.audit)
    };
    return OpportunityNoticeResponse.create(responseProps, null).getValue();
  }

  public static toPersistance(response: OpportunityNoticeResponse): IOpportunityNoticeResponseAttributes {
    return {
      requestorDecision: response.requestorDecision,
      requestorDecisionNote: response.requestorDecisionNote,
      requestorDecisionDate: response.requestorDecisionDate,
      planningDecision: response.planningDecision,
      planningDecisionNote: response.planningDecisionNote,
      audit: Audit.toPersistance(response.audit)
    };
  }
}

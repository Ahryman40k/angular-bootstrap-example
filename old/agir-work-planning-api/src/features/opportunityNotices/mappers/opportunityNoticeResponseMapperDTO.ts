import { IAudit, IEnrichedOpportunityNoticeResponse } from '@villemontreal/agir-work-planning-lib';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { OpportunityNoticeResponse } from '../models/opportunityNoticeResponse';

class OpportunityNoticeResponseMapperDTO extends FromModelToDtoMappings<
  OpportunityNoticeResponse,
  IEnrichedOpportunityNoticeResponse,
  void
> {
  protected async getFromNotNullModel(
    opportunityNoticeResponse: OpportunityNoticeResponse
  ): Promise<IEnrichedOpportunityNoticeResponse> {
    if (!opportunityNoticeResponse) {
      return undefined;
    }
    const auditDTO = await auditMapperDTO.getFromModel(opportunityNoticeResponse.audit);
    return this.map(opportunityNoticeResponse, auditDTO);
  }

  private map(opportunityNoticeResponse: OpportunityNoticeResponse, auditDTO: IAudit) {
    return {
      requestorDecision: opportunityNoticeResponse.requestorDecision,
      requestorDecisionNote: opportunityNoticeResponse.requestorDecisionNote,
      requestorDecisionDate: opportunityNoticeResponse.requestorDecisionDate,
      planningDecision: opportunityNoticeResponse.planningDecision,
      planningDecisionNote: opportunityNoticeResponse.planningDecisionNote,
      audit: auditDTO
    };
  }
}

export const opportunityNoticeResponseMapperDTO = new OpportunityNoticeResponseMapperDTO();

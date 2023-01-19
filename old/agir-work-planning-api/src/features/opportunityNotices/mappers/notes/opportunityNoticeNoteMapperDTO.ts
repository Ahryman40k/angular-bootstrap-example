import { IAudit, IEnrichedNote } from '@villemontreal/agir-work-planning-lib';

import { FromModelToDtoMappings } from '../../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../../audit/mappers/auditMapperDTO';
import { OpportunityNoticeNote } from '../../models/notes/opportunityNoticeNote';

class OpportunityNoticeNoteMapperDTO extends FromModelToDtoMappings<OpportunityNoticeNote, IEnrichedNote, void> {
  protected async getFromNotNullModel(opportunityNoticeNote: OpportunityNoticeNote): Promise<IEnrichedNote> {
    const auditDTO = await auditMapperDTO.getFromModel(opportunityNoticeNote.audit);
    return this.map(opportunityNoticeNote, auditDTO);
  }

  // For now it is a one/one but could be different
  private map(opportunityNoticeNote: OpportunityNoticeNote, auditDTO: IAudit) {
    return {
      id: opportunityNoticeNote.id.toString(),
      text: opportunityNoticeNote.text,
      audit: auditDTO
    };
  }
}

export const opportunityNoticeNoteMapperDTO = new OpportunityNoticeNoteMapperDTO();

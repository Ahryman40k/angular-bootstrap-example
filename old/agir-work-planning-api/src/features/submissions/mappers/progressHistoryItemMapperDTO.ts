import { IAudit, IProgressHistoryItem } from '@villemontreal/agir-work-planning-lib';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { ProgressHistoryItem } from '../models/progressHistoryItem';

class ProgressHistoryItemMapperDTO extends FromModelToDtoMappings<ProgressHistoryItem, IProgressHistoryItem, void> {
  protected async getFromNotNullModel(progressHistoryItem: ProgressHistoryItem): Promise<IProgressHistoryItem> {
    const auditDTO = await auditMapperDTO.getFromModel(progressHistoryItem.audit);
    return this.map(progressHistoryItem, auditDTO);
  }

  private map(progressHistoryItem: ProgressHistoryItem, auditDTO: IAudit): IProgressHistoryItem {
    return {
      progressStatus: progressHistoryItem.progressStatus,
      createdAt: auditDTO.createdAt,
      createdBy: auditDTO.createdBy
    };
  }
}

export const progressHistoryMapperDTO = new ProgressHistoryItemMapperDTO();

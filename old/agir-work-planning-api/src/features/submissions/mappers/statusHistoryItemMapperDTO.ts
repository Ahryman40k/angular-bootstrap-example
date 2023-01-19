import { IStatusHistoryItem } from '@villemontreal/agir-work-planning-lib';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { StatusHistoryItem } from '../models/statusHistoryItem';

class StatusHistoryItemMapperDTO extends FromModelToDtoMappings<StatusHistoryItem, IStatusHistoryItem, void> {
  protected async getFromNotNullModel(statusHistoryItem: StatusHistoryItem): Promise<IStatusHistoryItem> {
    return this.map(statusHistoryItem);
  }

  private map(statusHistoryItem: StatusHistoryItem): IStatusHistoryItem {
    return {
      status: statusHistoryItem.status,
      comment: statusHistoryItem.comment,
      createdAt: statusHistoryItem.createdAt,
      createdBy: {
        displayName: statusHistoryItem.createdBy.displayName,
        userName: statusHistoryItem.createdBy.userName
      }
    };
  }
}

export const statusHistoryMapperDTO = new StatusHistoryItemMapperDTO();

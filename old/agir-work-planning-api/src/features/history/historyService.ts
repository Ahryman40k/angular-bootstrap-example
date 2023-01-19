import {
  CommentCategory,
  ExternalReferenceType,
  IComment,
  IEnrichedIntervention,
  IEnrichedProject,
  IExternalReferenceId
} from '@villemontreal/agir-work-planning-lib';
import * as _ from 'lodash';

import { EntityType } from '../../../config/constants';
import { IRoadNetwork } from '../../services/spatialAnalysisService/spatialAnalysisType';
import { IHistoryOptions } from './mongo/historyRepository';

export interface IMoreInformation {
  infoRTUReferenceNumber?: IExternalReferenceId;
  medalId?: string;
  otherComments?: IComment[];
  ptiNumber?: IExternalReferenceId;
  requerantReferenceNumber?: IExternalReferenceId;
  riskId?: string;
  riskComments?: IComment[];
  roadNetworkTypeId?: IRoadNetwork;
}

class HistoryService {
  public buildHistoryOptions<T extends IMoreInformation>(
    entityType: EntityType,
    currentEntity: T,
    newEntity: T
  ): IHistoryOptions {
    const historyOptions: IHistoryOptions = {} as IHistoryOptions;
    if (entityType === EntityType.moreInformation && !_.isEqual(currentEntity, newEntity)) {
      historyOptions.comments = `une information a été modifiée dans la section informations supplémentaires`;
      return historyOptions;
    }
    return null;
  }

  public buildCommonMoreInformation<T extends IEnrichedIntervention | IEnrichedProject>(entity: T): IMoreInformation {
    const moreInformation: IMoreInformation = {} as IMoreInformation;
    if (entity && entity.comments && entity.comments.length) {
      const otherComments = entity.comments.filter(comment => comment.categoryId === CommentCategory.other);
      if (otherComments) {
        moreInformation.otherComments = otherComments;
      }
    }
    if (entity && entity.externalReferenceIds && entity.externalReferenceIds.length) {
      const ptiNumber = entity.externalReferenceIds
        .filter(reference => reference.type === ExternalReferenceType.ptiNumber)
        .pop();
      if (ptiNumber) {
        moreInformation.ptiNumber = ptiNumber;
      }
    }
    if (entity && entity.roadNetworkTypeId) {
      moreInformation.roadNetworkTypeId = entity.roadNetworkTypeId as IRoadNetwork;
    }
    return moreInformation;
  }
}

export const historyService = new HistoryService();

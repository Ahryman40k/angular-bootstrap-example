import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { IOpportunityNoticeCriterias } from './models/opportunityNoticeFindOptions';

class OpportunityNoticeMatchBuilder extends BaseMatchBuilder<IOpportunityNoticeCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    projectId: 'projectId'
  };

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case 'id':
      case '_id':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      default:
        return {
          [criteriaKey]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }
}

export const opportunityNoticeMatchBuilder = new OpportunityNoticeMatchBuilder();

import { isEmpty } from 'lodash';

import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { IRequirementCriterias } from './models/requirementFindOptions';

class RequirementMatchBuilder extends BaseMatchBuilder<IRequirementCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id'
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

  protected async getOtherFilterConstraints(criterias: IRequirementCriterias): Promise<any[]> {
    return [this.matchesItemTypeAndId(criterias)];
  }

  private matchesItemTypeAndId(criterias: IRequirementCriterias): any {
    const correspondence = {
      itemId: 'id',
      itemType: 'type'
    };
    let uniqueElemMatch = {};
    ['itemId', 'itemType'].forEach(key => {
      if (criterias[key]) {
        uniqueElemMatch = {
          ...uniqueElemMatch,
          [correspondence[key]]: { $in: convertStringOrStringArray(criterias[key]) }
        };
      }
    });

    if (isEmpty(uniqueElemMatch)) {
      return;
    }

    return { items: { $elemMatch: uniqueElemMatch } };
  }
}

export const requirementMatchBuilder = new RequirementMatchBuilder();

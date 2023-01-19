import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { ITaxonomyCriterias } from './models/taxonomyFindOptions';

class TaxonomyMatchBuilder extends BaseMatchBuilder<ITaxonomyCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    group: 'group',
    code: 'code',
    properties: 'properties'
  };

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case 'id':
      case '_id':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      case 'properties':
        return { [criteriaKey]: criteriaValue };
      case 'group':
      case 'code':
      default:
        return {
          [criteriaKey]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }
}

export const taxonomyMatchBuilder = new TaxonomyMatchBuilder();

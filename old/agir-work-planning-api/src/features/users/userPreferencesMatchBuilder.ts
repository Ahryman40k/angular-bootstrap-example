
import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { IUserPreferenceCriterias } from './models/userPreferenceFindOptions';

class UserPreferencesMatchBuilder extends BaseMatchBuilder<IUserPreferenceCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    userId: 'userId',
    key: 'key'
  };

  // tslint:disable:cyclomatic-complexity
  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case '_id':
      case 'id':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      default:
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }
}

export const userPreferencesMatchBuilder = new UserPreferencesMatchBuilder();

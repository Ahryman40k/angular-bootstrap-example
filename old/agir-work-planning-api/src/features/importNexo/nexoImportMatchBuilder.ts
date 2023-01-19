import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { INexoImportLogCriterias } from './models/nexoImportLogFindOptions';

class NexoImportMatchBuilder extends BaseMatchBuilder<INexoImportLogCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    status: 'status',
    excludeIds: 'excludeIds'
  };

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case 'id':
      case '_id':
        return { [this.queryCorrespondence[criteriaKey]]: { $in: this.idsToObjectIds(criteriaValue) } };
      case 'excludeIds':
        return { _id: { $nin: this.idsToObjectIds(criteriaValue) } };
      default:
        return {
          [criteriaKey]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }
}

export const nexoImportMatchBuilder = new NexoImportMatchBuilder();

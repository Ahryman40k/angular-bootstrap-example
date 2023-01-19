import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { IRtuImportLogCriterias } from './models/rtuImportLogFindOptions';

class RtuImportMatchBuilder extends BaseMatchBuilder<IRtuImportLogCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    status: 'status'
  };

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    switch (criteriaKey) {
      case 'id':
      case '_id':
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: this.idsToObjectIds(criteriaValue)
          }
        };
      default:
        return {
          [this.queryCorrespondence[criteriaKey]]: {
            $in: convertStringOrStringArray(criteriaValue)
          }
        };
    }
  }
}

export const rtuImportMatchBuilder = new RtuImportMatchBuilder();

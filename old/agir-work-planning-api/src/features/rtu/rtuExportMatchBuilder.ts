import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { IRtuExportLogCriterias } from './models/rtuExportLogFindOptions';

class RtuExportMatchBuilder extends BaseMatchBuilder<IRtuExportLogCriterias> {
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

export const rtuExportMatchBuilder = new RtuExportMatchBuilder();

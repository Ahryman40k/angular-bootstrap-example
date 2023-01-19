import { BaseMatchBuilder } from '../../shared/findOptions/baseMatchBuilder';
import { convertStringOrStringArray } from '../../utils/arrayUtils';
import { IHistoryCriterias } from './models/historyFindOptions';

class HistoryMatchBuilder extends BaseMatchBuilder<IHistoryCriterias> {
  protected readonly queryCorrespondence = {
    id: '_id',
    statusFrom: 'summary.statusFrom',
    statusTo: 'summary.statusTo',
    objectTypeId: 'objectTypeId',
    referenceId: 'referenceId'
  };

  protected async getMatch(criteriaKey: string, criteriaValue: any) {
    return { [this.queryCorrespondence[criteriaKey]]: { $in: convertStringOrStringArray(criteriaValue) } };
  }
}

export const historyMatchBuilder = new HistoryMatchBuilder();

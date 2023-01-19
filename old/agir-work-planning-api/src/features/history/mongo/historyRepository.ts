import { IHistory } from '@villemontreal/agir-work-planning-lib';

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { Order, OrderByCriteria } from '../../../shared/findOptions/orderByCriteria';
import { historyMatchBuilder } from '../historyMatchBuilder';
import { IHistoryRepository } from '../iHistoryRepository';
import { HistoryFindOptions, IHistoryCriterias } from '../models/historyFindOptions';
import { HistoryModel, IHistoryMongoDocument } from './historyModel';

export interface IHistoryOptions {
  applyHistory?: boolean;
  categoryId?: string;
  comments?: string;
  operation?: string;
}
class HistoryRepository extends BaseRepository<IHistory, IHistoryMongoDocument, HistoryFindOptions>
  implements IHistoryRepository {
  public get model(): HistoryModel {
    return this.db.models.History;
  }

  protected async getMatchFromQueryParams(criterias: IHistoryCriterias): Promise<any> {
    return historyMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected getSortCorrespondance() {
    return [...super.getSortCorrespondance()];
  }

  protected getDefaultOrderBy(): OrderByCriteria {
    return OrderByCriteria.create({
      field: 'id',
      order: Order.ASCENDING
    }).getValue();
  }
}

export const historyRepository: IHistoryRepository = new HistoryRepository();

import { BaseRepository } from '../../../repositories/core/baseRepository';
import { Order, OrderByCriteria } from '../../../shared/findOptions/orderByCriteria';
import { Audit } from '../../audit/audit';
import { IBicImportLogRepository } from '../iBicImportLogRepository';
import { BicImportLog, IBicImportLogProps } from '../models/bicImportLog';
import { BicImportLogFindPaginatedOptions } from '../models/bicImportLogFindPaginatedOptions';
import { BicImportLogModel, IBicImportLogMongoDocument } from './bicImportLogModel';
import { IBicImportLogAttributes } from './bicImportLogSchema';

class BicImportLogsRepository
  extends BaseRepository<BicImportLog, IBicImportLogMongoDocument, BicImportLogFindPaginatedOptions>
  implements IBicImportLogRepository {
  public get model(): BicImportLogModel {
    return this.db.models.BicImportLog;
  }

  protected async toDomainModel(raw: IBicImportLogAttributes): Promise<BicImportLog> {
    const bicImportLogProps: IBicImportLogProps = {
      audit: await Audit.toDomainModel(raw.audit)
    };
    return BicImportLog.create(bicImportLogProps, raw._id.toString()).getValue();
  }

  protected toPersistence(bicimportLog: BicImportLog): IBicImportLogAttributes {
    return {
      _id: bicimportLog.id,
      audit: Audit.toPersistance(bicimportLog.audit)
    };
  }

  protected getDefaultOrderBy(): OrderByCriteria {
    return OrderByCriteria.create({
      field: 'audit.createdAt',
      order: Order.DESCENDING
    }).getValue();
  }
}
export const bicImportLogRepository: IBicImportLogRepository = new BicImportLogsRepository();

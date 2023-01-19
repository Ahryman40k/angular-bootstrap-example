import { BaseRepository, IBaseRepository } from '../../../repositories/core/baseRepository';
import { Order, OrderByCriteria } from '../../../shared/findOptions/orderByCriteria';
import { IImportErrorAttributes } from '../../../shared/import/importErrorSchema';
import { Audit } from '../../audit/audit';
import { RtuImportError } from '../models/rtuImportError';
import { RtuImportLog } from '../models/rtuImportLog';
import { IRtuImportLogCriterias, RtuImportLogFindOptions } from '../models/rtuImportLogFindOptions';
import { RtuProjectError } from '../models/rtuProjectError';
import { rtuImportMatchBuilder } from '../rtuImportMatchBuilder';
import { IRtuImportLogMongoAttributes, IRtuImportLogMongoDocument, RtuImportLogModel } from './rtuImportLogModel';

const RTUIMPORTLOG_MANDATORY_FIELDS = ['startDateTime', 'endDateTime'];
// tslint:disable:no-empty-interface

export interface IRtuImportLogRepository extends IBaseRepository<RtuImportLog, RtuImportLogFindOptions> {}

class RtuImportLogRepository extends BaseRepository<RtuImportLog, IRtuImportLogMongoDocument, RtuImportLogFindOptions>
  implements IRtuImportLogRepository {
  public get model(): RtuImportLogModel {
    return this.db.models.RtuImportLog;
  }

  protected async getMatchFromQueryParams(criterias: IRtuImportLogCriterias): Promise<any> {
    return rtuImportMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected getSortCorrespondance() {
    return [
      ...super.getSortCorrespondance(),
      { param: 'startDateTime', dbName: 'startDateTime' },
      { param: 'endDateTime', dbName: 'endDateTime' },
      { param: 'status', dbName: 'status' }
    ];
  }

  protected getDefaultOrderBy(): OrderByCriteria {
    return OrderByCriteria.create({
      field: 'audit.createdAt',
      order: Order.DESCENDING
    }).getValue();
  }

  protected async toDomainModel(raw: IRtuImportLogMongoAttributes): Promise<RtuImportLog> {
    let failedProjects;
    if (raw.failedProjects) {
      failedProjects = await Promise.all(
        raw.failedProjects.map(failedProject => RtuProjectError.toDomainModel(failedProject))
      );
    }
    let errorDetail: RtuImportError;
    if (raw.errorDetail) {
      errorDetail = await RtuImportError.toDomainModel(raw.errorDetail);
    }
    return RtuImportLog.create(
      {
        status: raw.status,
        startDateTime: raw.startDateTime,
        endDateTime: raw.endDateTime,
        errorDetail,
        failedProjects,
        audit: await Audit.toDomainModel(raw.audit)
      },
      raw._id.toString()
    ).getValue();
  }

  protected toPersistence(rtuImportLog: RtuImportLog): IRtuImportLogMongoAttributes {
    let errorDetail: IImportErrorAttributes;
    if (rtuImportLog.errorDetail) {
      errorDetail = RtuImportError.toPersistance(rtuImportLog.errorDetail);
    }
    return {
      _id: rtuImportLog.id,
      startDateTime: rtuImportLog.startDateTime.toISOString(),
      endDateTime: rtuImportLog.endDateTime.toISOString(),
      status: rtuImportLog.status,
      errorDetail,
      failedProjects: rtuImportLog?.failedProjects?.map(failedProject => RtuProjectError.toPersistance(failedProject)),
      audit: Audit.toPersistance(rtuImportLog.audit)
    };
  }

  protected getProjection(fields: string[]): any {
    return super.getProjection(fields, RTUIMPORTLOG_MANDATORY_FIELDS);
  }
}

export const rtuImportLogRepository: IRtuImportLogRepository = new RtuImportLogRepository();

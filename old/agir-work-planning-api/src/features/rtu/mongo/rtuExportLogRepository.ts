import { BaseRepository, IBaseRepository } from '../../../repositories/core/baseRepository';
import { Order, OrderByCriteria } from '../../../shared/findOptions/orderByCriteria';
import { IImportErrorAttributes } from '../../../shared/import/importErrorSchema';
import { Audit } from '../../audit/audit';
import { RtuExportError } from '../models/rtuExportError';
import { RtuExportLog } from '../models/rtuExportLog';
import { IRtuExportLogCriterias, RtuExportLogFindOptions } from '../models/rtuExportLogFindOptions';
import { RtuProjectExportSummary } from '../models/rtuProjectExport/rtuProjectExportSummary';
import { rtuExportMatchBuilder } from '../rtuExportMatchBuilder';
import { IRtuExportLogMongoAttributes, IRtuExportLogMongoDocument, RtuExportLogModel } from './rtuExportLogModel';

const RTUEXPORTLOG_MANDATORY_FIELDS = ['startDateTime'];

// tslint:disable:no-empty-interface
export interface IRtuExportLogRepository extends IBaseRepository<RtuExportLog, RtuExportLogFindOptions> {}

class RtuExportLogRepository extends BaseRepository<RtuExportLog, IRtuExportLogMongoDocument, RtuExportLogFindOptions>
  implements IRtuExportLogRepository {
  public get model(): RtuExportLogModel {
    return this.db.models.RtuExportLog;
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

  protected async getMatchFromQueryParams(criterias: IRtuExportLogCriterias): Promise<any> {
    return rtuExportMatchBuilder.getMatchFromQueryParams(criterias);
  }

  protected async toDomainModel(raw: IRtuExportLogMongoAttributes): Promise<RtuExportLog> {
    let errorDetail: RtuExportError;
    let projects: RtuProjectExportSummary[] = [];
    if (raw.errorDetail) {
      errorDetail = await RtuExportError.toDomainModel(raw.errorDetail);
    }
    if (raw.projects) {
      projects = await Promise.all(raw.projects.map(project => RtuProjectExportSummary.toDomainModel(project)));
    }
    return RtuExportLog.create(
      {
        status: raw.status,
        startDateTime: raw.startDateTime,
        endDateTime: raw.endDateTime,
        errorDetail,
        projects,
        audit: await Audit.toDomainModel(raw.audit)
      },
      raw._id.toString()
    ).getValue();
  }

  protected toPersistence(rtuExportLog: RtuExportLog): IRtuExportLogMongoAttributes {
    let errorDetail: IImportErrorAttributes;
    if (rtuExportLog.errorDetail) {
      errorDetail = RtuExportError.toPersistance(rtuExportLog.errorDetail);
    }
    return {
      _id: rtuExportLog.id,
      startDateTime: rtuExportLog.startDateTime.toISOString(),
      endDateTime: rtuExportLog.endDateTime ? rtuExportLog.endDateTime.toISOString() : undefined,
      status: rtuExportLog.status,
      errorDetail,
      projects: rtuExportLog?.projects?.map(project => RtuProjectExportSummary.toPersistance(project)),
      audit: Audit.toPersistance(rtuExportLog.audit)
    };
  }

  protected getProjection(fields: string[]): any {
    return super.getProjection(fields, RTUEXPORTLOG_MANDATORY_FIELDS);
  }
}

export const rtuExportLogRepository: IRtuExportLogRepository = new RtuExportLogRepository();

import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IImportErrorAttributes } from '../../../shared/import/importErrorSchema';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { RtuExportStatus } from '../models/rtuExportLog';
import { RtuProjectExportStatus } from '../models/rtuProjectExport/rtuProjectExport';
import { rtuExportLogSchema } from './rtuExportLogSchema';

// tslint:disable:no-empty-interface
export interface IRtuExportErrorAttributes extends IImportErrorAttributes {}

export interface IRtuProjectExportAttributes {
  _id: string;
  status: RtuProjectExportStatus;
  projectName: string;
  streetName: string;
  streetFrom: string;
  streetTo: string;
  errorDetails: IRtuExportErrorAttributes[];
}

export interface IRtuExportLogMongoAttributes {
  _id: string;
  status: RtuExportStatus;
  startDateTime: string;
  endDateTime: string;
  audit: IAuditAttributes;
  errorDetail: IRtuExportErrorAttributes;
  projects: IRtuProjectExportAttributes[];
}

export type IRtuExportLogMongoDocument = IRtuExportLogMongoAttributes & Document;
export type RtuExportLogModel = CustomModel<IRtuExportLogMongoAttributes>;

export const rtuExportLogModelFactory = (mongoose: Connection) => {
  const rtuExportLogModel = mongoose.model<IRtuExportLogMongoDocument>(
    constants.mongo.collectionNames.RTU_EXPORT_LOGS,
    rtuExportLogSchema
  ) as RtuExportLogModel;
  rtuExportLogModel.schema = rtuExportLogSchema;

  rtuExportLogModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return rtuExportLogModel;
};

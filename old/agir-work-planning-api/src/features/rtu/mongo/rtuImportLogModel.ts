import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IImportErrorAttributes } from '../../../shared/import/importErrorSchema';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { IRtuImportLogProps, RtuImportStatus } from '../models/rtuImportLog';
import { rtuImportLogSchema } from './rtuImportLogSchema';

// tslint:disable:no-empty-interface
export interface IRtuImportErrorAttributes extends IImportErrorAttributes {}
export interface IRtuProjectErrorAttributes {
  projectId: string;
  projectNoReference: string;
  projectName: string;
  streetName: string;
  streetFrom: string;
  streetTo: string;
  errorDetails: IRtuImportErrorAttributes[];
}

export interface IRtuImportLogMongoAttributes {
  _id: string;
  status: RtuImportStatus;
  startDateTime: string;
  endDateTime: string;
  audit: IAuditAttributes;
  errorDetail: IRtuImportErrorAttributes;
  failedProjects: IRtuProjectErrorAttributes[];
}

export type IRtuImportLogMongoDocument = IRtuImportLogProps & Document;
export type RtuImportLogModel = CustomModel<IRtuImportLogProps>;

export const rtuImportLogModelFactory = (mongoose: Connection) => {
  const rtuImportLogModel = mongoose.model<IRtuImportLogMongoDocument>(
    constants.mongo.collectionNames.RTU_IMPORT_LOGS,
    rtuImportLogSchema
  ) as RtuImportLogModel;
  rtuImportLogModel.schema = rtuImportLogSchema;

  rtuImportLogModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return rtuImportLogModel;
};

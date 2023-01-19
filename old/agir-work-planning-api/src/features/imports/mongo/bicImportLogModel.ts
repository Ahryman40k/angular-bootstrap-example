import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { bicImportLogSchema, IBicImportLogAttributes } from './bicImportLogSchema';

export type IBicImportLogMongoDocument = IBicImportLogAttributes & Document;
export type BicImportLogModel = CustomModel<IBicImportLogAttributes>;

export const bicImportLogsModelFactory = (mongoose: Connection) => {
  const bicImportLogModel = mongoose.model<IBicImportLogMongoDocument>(
    constants.mongo.collectionNames.BIC_IMPORT_LOGS,
    bicImportLogSchema
  ) as BicImportLogModel;
  bicImportLogModel.schema = bicImportLogSchema;
  bicImportLogModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return bicImportLogModel;
};

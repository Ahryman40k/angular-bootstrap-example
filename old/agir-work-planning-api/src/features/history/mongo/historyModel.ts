import { IHistory } from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { historySchema } from './historySchemas';

export type IHistoryMongoDocument = IHistory & Document;
export type HistoryModel = CustomModel<IHistory>;

export const historyModelFactory = (mongoose: Connection) => {
  const historyModel = mongoose.model<IHistoryMongoDocument>(
    constants.mongo.collectionNames.HISTORY,
    historySchema
  ) as HistoryModel;
  historyModel.schema = historySchema;

  historyModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return historyModel;
};

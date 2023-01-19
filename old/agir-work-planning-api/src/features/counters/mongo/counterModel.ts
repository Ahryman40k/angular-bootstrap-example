import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { counterSchema, ICounterAttributes } from './counterSchema';

export type ICounterMongoDocument = ICounterAttributes & Document;
export type CounterModel = CustomModel<ICounterMongoDocument & { findOneAndUpsertCounter(): {} }>;

export const counterModelFactory = (mongoose: Connection) => {
  const counterModel = mongoose.model<ICounterMongoDocument>(
    constants.mongo.collectionNames.COUNTERS,
    counterSchema
  ) as CounterModel;
  counterModel.schema = counterSchema;
  counterModel.lookups = () => {
    return;
  };

  return counterModel;
};

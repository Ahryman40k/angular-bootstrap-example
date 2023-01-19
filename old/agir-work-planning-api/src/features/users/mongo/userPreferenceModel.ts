import { IEnrichedUserPreference } from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { userPreferenceSchema } from './userPreferenceSchema';

export type IUserPreferenceMongoDocument = IEnrichedUserPreference & Document;
export type UserPreferenceModel = CustomModel<IEnrichedUserPreference>;

export const userPreferencesModelFactory = (mongoose: Connection) => {
  const userPreferenceModel = mongoose.model<IUserPreferenceMongoDocument>(
    constants.mongo.collectionNames.USERS_PREFERENCES,
    userPreferenceSchema
  ) as UserPreferenceModel;
  userPreferenceModel.schema = userPreferenceSchema;
  userPreferenceModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return userPreferenceModel;
};

import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { auditSchema } from '../../audit/mongo/auditSchema';

export const userPreferenceSchema = new Schema(
  {
    key: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      required: true
    },
    value: {
      type: Object,
      required: true
    },
    audit: auditSchema,
    __v: Number
  },
  {
    collection: constants.mongo.collectionNames.USERS_PREFERENCES,
    versionKey: false
  }
);

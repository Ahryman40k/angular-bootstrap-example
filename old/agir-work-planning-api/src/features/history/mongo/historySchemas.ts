import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { auditSchema } from '../../audit/mongo/auditSchema';

export const historySchema = new Schema(
  {
    objectTypeId: {
      type: String,
      required: true
    },
    referenceId: {
      type: String,
      required: true
    },
    actionId: {
      type: String,
      required: true
    },
    categoryId: {
      type: String,
      required: false
    },
    summary: {
      statusFrom: {
        type: String,
        required: false
      },
      statusTo: {
        type: String,
        required: false
      },
      comments: {
        type: String,
        required: false
      }
    },
    audit: auditSchema,
    __v: Number
  },
  {
    collection: constants.mongo.collectionNames.HISTORY,
    versionKey: false
  }
);

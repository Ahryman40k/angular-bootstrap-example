import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { auditSchema } from '../../audit/mongo/auditSchema';

const requirementItemSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

requirementItemSchema.index({ id: 1, type: 1 });

export const requirementSchema = new Schema(
  {
    typeId: {
      type: String,
      required: true
    },
    subtypeId: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    items: {
      type: [requirementItemSchema],
      required: true
    },
    audit: auditSchema,
    __v: Number
  },
  {
    strict: false,
    collection: constants.mongo.collectionNames.REQUIREMENTS,
    versionKey: false
  }
);

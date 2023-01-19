import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';

const audit = {
  createdBy: String,
  createdOn: Date,
  lastModifiedBy: String,
  lastModifiedOn: Date
};

export const taxonomySchema = new Schema(
  {
    code: String,
    group: String,
    label: { fr: String, en: String },
    properties: Object,
    description: { fr: String, en: String },
    isActive: Boolean,
    displayOrder: Number,
    valueString1: String,
    valueString2: String,
    valueBoolean1: Boolean,
    audit,
    __v: Number
  },
  {
    collection: constants.mongo.collectionNames.TAXONOMIES,
    versionKey: false
  }
);

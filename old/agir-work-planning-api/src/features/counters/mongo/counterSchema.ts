import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';

export interface ICounterAttributes {
  _id: string;
  key: string;
  sequence: number;
  availableValues: number[];
  __v: number;
}

export const counterSchema = new Schema(
  {
    _id: { type: String, required: true },
    key: { type: String, required: true, index: true },
    sequence: { type: Number, default: 0 },
    availableValues: {
      type: [Number],
      required: false
    },
    __v: { type: Number }
  },
  {
    strict: false,
    collection: constants.mongo.collectionNames.COUNTERS,
    versionKey: '__v'
  }
);

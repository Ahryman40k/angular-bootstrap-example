import { Schema } from 'mongoose';

export interface IObjectiveValuesMongoAttributes {
  reference: number;
  calculated: number;
}

export const objectiveValuesSchema = new Schema(
  {
    reference: {
      type: Number,
      required: true
    },
    calculated: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

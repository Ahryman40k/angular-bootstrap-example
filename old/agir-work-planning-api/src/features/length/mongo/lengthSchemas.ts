import { Schema } from 'mongoose';

// tslint:disable:no-empty-interface
export interface ILengthAttributes {
  value: number;
  unit: string;
}

export const lengthSchema = new Schema(
  {
    unit: {
      type: String
    },
    length: {
      value: Number
    }
  },
  { _id: false }
);

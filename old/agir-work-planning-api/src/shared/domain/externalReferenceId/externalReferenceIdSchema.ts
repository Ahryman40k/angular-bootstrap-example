import { Schema } from 'mongoose';

export interface IExternalReferenceIdAttributes {
  type: string;
  value: string;
}

export const externalReferenceSchema = new Schema(
  {
    type: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

import { Schema } from 'mongoose';
import { IImportErrorValues } from './importError';

export interface IImportErrorAttributes {
  code: string;
  target: string;
  values: IImportErrorValues;
}

const importErrorValues = new Schema(
  {
    value1: {
      type: Schema.Types.Mixed,
      required: true
    },
    value2: {
      type: Schema.Types.Mixed,
      required: false
    },
    value3: {
      type: Schema.Types.Mixed,
      required: false
    }
  },
  { _id: false }
);

export const importErrorSchema = new Schema(
  {
    code: {
      type: String,
      required: true
    },
    target: {
      type: String,
      required: true
    },
    values: {
      type: importErrorValues,
      required: false
    },
    line: {
      type: Number,
      required: false
    }
  },
  { _id: false }
);

import { IAuthor, IDate } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Schema } from 'mongoose';

import { authorSchema } from '../../audit/mongo/authorSchema';

export interface IStatusHistoryItemAttributes {
  status: string;
  comment: string;
  createdAt: IDate;
  createdBy: IAuthor;
}
export const statusHistoryItemSchema = new Schema<IStatusHistoryItemAttributes>(
  {
    status: {
      type: String,
      required: true
    },
    comment: {
      type: String,
      required: true
    },
    createdAt: {
      type: String,
      required: true
    },
    createdBy: authorSchema
  },
  { _id: false }
);

import { Schema } from 'mongoose';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface IProgressHistoryItemAttributes {
  progressStatus: string;
  audit: IAuditAttributes;
}
export const progressHistoryItemSchema = new Schema<IProgressHistoryItemAttributes>(
  {
    progressStatus: {
      type: String,
      required: true
    },
    audit: {
      type: auditSchema,
      required: true
    }
  },
  { _id: false }
);

import { Schema } from 'mongoose';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface IOrderedProjectMongoAttributes {
  projectId: string;
  levelRank: number;
  initialRank: number;
  rank: number;
  isManuallyOrdered: boolean;
  note: string;
  audit: IAuditAttributes;
}

export const orderedProjectsSchema = new Schema(
  {
    rank: {
      type: Number,
      required: true
    },
    isManuallyOrdered: {
      type: Boolean,
      required: true,
      default: false
    },
    projectId: {
      type: String,
      required: true
    },
    levelRank: {
      type: Number,
      required: true
    },
    initialRank: {
      type: Number,
      required: false
    },
    note: {
      type: String,
      required: false
    },
    audit: {
      type: auditSchema,
      required: false
    }
  },
  { _id: false }
);

import { Schema, Types } from 'mongoose';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface ICommentAttributes {
  _id: Types.ObjectId;
  categoryId: string;
  text: string;
  isPublic: boolean;
  isProjectVisible: boolean;
  audit: IAuditAttributes;
}

export const commentSchema = new Schema({
  categoryId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isPublic: {
    type: Boolean,
    required: false,
    default: true
  },
  isProjectVisible: {
    type: Boolean,
    required: false
  },
  audit: auditSchema
});

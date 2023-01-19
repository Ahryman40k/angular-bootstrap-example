import { Schema, Types } from 'mongoose';

import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface IRequirementMongoAttributes {
  _id: Types.ObjectId;
  mentionId: string;
  typeId: string;
  subtypeId: string;
  text: string;
  isDeprecated: boolean;
  projectIds: string[];
  planningRequirementId: string;
  audit: IAuditAttributes;
}

export const requirementSchema = new Schema({
  mentionId: {
    type: String,
    required: true
  },
  typeId: {
    type: String,
    required: true
  },
  subtypeId: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  isDeprecated: {
    type: Boolean,
    required: true
  },
  projectIds: {
    type: [String],
    required: false
  },
  planningRequirementId: {
    type: String,
    required: false
  },
  audit: auditSchema
});

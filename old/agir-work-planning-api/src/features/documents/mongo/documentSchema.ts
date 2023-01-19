import { DocumentStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Schema, Types } from 'mongoose';

import { auditSchema, IAuditAttributes } from '../../../features/audit/mongo/auditSchema';

export interface IDocumentMongoAttributes {
  _id: Types.ObjectId;
  objectId: string;
  fileName: string;
  documentName: string;
  notes: string;
  type: string;
  validationStatus: string;
  audit: IAuditAttributes;
}

export interface IInterventionDocumentMongoAttributes extends IDocumentMongoAttributes {
  isProjectVisible: boolean;
}

const documentSchema = {
  fileName: {
    type: String,
    required: true
  },
  documentName: {
    type: String,
    required: true
  },
  notes: {
    type: String,
    required: false
  },
  objectId: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: false
  },
  validationStatus: {
    type: String,
    required: true,
    default: DocumentStatus.pending
  },
  audit: auditSchema
};

export const interventionDocumentSchema = new Schema({
  ...documentSchema,
  isProjectVisible: {
    type: Boolean,
    required: true
  }
});

export const projectDocumentSchema = new Schema(documentSchema);
export const submissionDocumentSchema = new Schema(documentSchema);

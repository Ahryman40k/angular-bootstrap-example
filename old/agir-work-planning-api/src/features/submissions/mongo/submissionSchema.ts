import { Schema } from 'mongoose';

import { auditSchema } from '../../audit/mongo/auditSchema';
import { submissionDocumentSchema } from '../../documents/mongo/documentSchema';
import { requirementSchema } from '../../requirements/mongo/requirementSchemas';
import { progressHistoryItemSchema } from './progressHistoryItemSchema';
import { statusHistoryItemSchema } from './statusHistoryItemSchema';
import { ISubmissionAttributes } from './submissionModel';

export const submissionSchema = new Schema<ISubmissionAttributes>(
  {
    _id: {
      type: String,
      required: true
    },
    drmNumber: {
      type: String,
      required: true
    },
    programBookId: {
      type: Schema.Types.ObjectId,
      ref: 'program_books',
      required: true
    },
    projectIds: {
      type: [String],
      required: true
    },
    status: {
      type: String,
      required: true
    },
    progressStatus: {
      type: String,
      required: true
    },
    progressHistory: {
      type: [progressHistoryItemSchema],
      required: false
    },
    statusHistory: {
      type: [statusHistoryItemSchema],
      required: false
    },
    documents: {
      type: [submissionDocumentSchema],
      required: false,
      default: undefined
    },
    requirements: {
      type: [requirementSchema],
      required: false,
      default: undefined
    },
    audit: {
      type: auditSchema,
      required: true
    }
  },
  {
    _id: false,
    versionKey: false
  }
);

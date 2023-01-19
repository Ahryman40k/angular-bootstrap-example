import { IDate } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { assetSchema } from '../../asset/mongo/assetSchemas';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface IOpportunityNoticeResponseAttributes {
  requestorDecision: string;
  requestorDecisionNote: string;
  requestorDecisionDate?: IDate;
  planningDecision: string;
  planningDecisionNote: string;
  audit: IAuditAttributes;
}
const responseSchema = new Schema({
  requestorDecision: {
    type: String,
    required: false
  },
  requestorDecisionNote: {
    type: String,
    required: false,
    default: undefined
  },
  requestorDecisionDate: {
    type: String,
    required: false
  },
  planningDecision: {
    type: String,
    required: false
  },
  planningDecisionNote: {
    type: String,
    required: false,
    default: undefined
  },
  audit: auditSchema
});

export interface IOpportunityNoticeNoteAttributes {
  _id: string;
  text: string;
  audit: IAuditAttributes;
}
const noteSchema = new Schema({
  text: {
    type: String,
    required: false
  },
  audit: auditSchema
});

export const opportunityNoticeSchema = new Schema(
  {
    assets: [assetSchema],
    contactInfo: {
      type: String,
      required: false,
      default: undefined
    },
    followUpMethod: {
      type: String,
      required: true
    },
    maxIterations: {
      type: Number,
      required: true,
      default: 1
    },
    object: {
      type: String,
      required: false,
      default: undefined
    },
    projectId: {
      type: String,
      required: true,
      default: undefined
    },
    requestorId: {
      type: String,
      required: true,
      default: undefined
    },
    status: {
      type: String,
      required: false,
      default: undefined
    },
    workTypeId: {
      type: String,
      required: false,
      default: undefined
    },
    notes: {
      type: [noteSchema],
      required: false
    },
    response: {
      type: responseSchema,
      required: false
    },
    audit: auditSchema,
    __v: Number
  },
  {
    strict: false,
    collection: constants.mongo.collectionNames.OPPORTUNITY_NOTICES,
    versionKey: false
  }
);

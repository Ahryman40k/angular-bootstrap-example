import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { globalBudgetSchema } from '../../../repositories/schemas/globalBudgetSchema';
import { annualDistributionSchema } from '../../../repositories/schemas/projectAnnualDistributionSchema';
import { externalReferenceSchema } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { auditSchema } from '../../audit/mongo/auditSchema';
import { commentSchema } from '../../comments/mongo/commentSchema';
import { projectDocumentSchema } from '../../documents/mongo/documentSchema';
import { servicePrioritySchema } from '../../servicePriority/mongo/servicePrioritySchema';

const exportRtuSchema = new Schema({
  status: {
    type: String,
    required: true
  },
  exportAt: {
    type: Date,
    required: true
  }
});

const decisionSchema = new Schema({
  typeId: {
    type: String,
    required: true
  },
  previousStartYear: {
    type: Number,
    required: false
  },
  previousEndYear: {
    type: Number,
    required: false
  },
  startYear: {
    type: Number
  },
  endYear: {
    type: Number
  },
  text: {
    type: String,
    required: true
  },
  refusalReasonId: {
    type: String
  },
  audit: auditSchema
});

export const projectSchema = new Schema(
  {
    _id: String,
    projectName: {
      type: String,
      required: false,
      default: undefined
    },
    projectTypeId: {
      type: String,
      required: false,
      default: undefined
    },
    boroughId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: false,
      default: undefined
    },
    medalId: {
      type: String,
      required: false,
      default: undefined
    },
    riskId: {
      type: String,
      required: false,
      default: undefined
    },
    executorId: {
      type: String,
      required: true
    },
    subCategoryIds: {
      type: [String],
      required: false
    },
    inChargeId: {
      type: String,
      required: false,
      default: undefined
    },
    startYear: {
      type: Number,
      required: true
    },
    endYear: {
      type: Number,
      required: true
    },
    globalBudget: {
      type: globalBudgetSchema,
      required: false,
      default: undefined
    },
    geometry: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined
    },
    geometryPin: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined
    },
    interventionIds: {
      type: [String],
      required: false,
      default: undefined
    },
    decisions: {
      type: [decisionSchema],
      required: false,
      default: undefined
    },
    interventions: {
      type: [{ type: Schema.Types.ObjectId, ref: 'interventions' }],
      required: false,
      default: undefined
    },
    comments: {
      type: [commentSchema],
      required: false,
      default: undefined
    },
    externalReferenceIds: {
      type: [externalReferenceSchema],
      required: false,
      default: undefined
    },
    roadNetworkTypeId: {
      type: String,
      required: false,
      default: undefined
    },
    importFlag: {
      type: String,
      required: false,
      default: undefined
    },
    streetName: {
      type: String,
      required: false,
      default: undefined
    },
    streetFrom: {
      type: String,
      required: false,
      default: undefined
    },
    streetTo: {
      type: String,
      required: false,
      default: undefined
    },
    length: {
      required: false,
      value: Number,
      unit: String
    },
    documents: {
      type: [projectDocumentSchema],
      required: false,
      default: undefined
    },
    audit: {
      type: auditSchema,
      required: true
    },
    annualDistribution: {
      type: annualDistributionSchema,
      required: false
    },
    servicePriorities: {
      type: [servicePrioritySchema],
      required: false,
      default: undefined
    },
    drmNumber: {
      type: String,
      required: false,
      default: undefined
    },
    submissionNumber: {
      type: String,
      required: false,
      default: undefined
    },
    exportRtu: {
      type: exportRtuSchema,
      required: false,
      default: undefined
    },
    moreInformationAudit: auditSchema,
    __v: Number
  },
  {
    strict: false,
    collection: constants.mongo.collectionNames.PROJECTS,
    versionKey: false
  }
);

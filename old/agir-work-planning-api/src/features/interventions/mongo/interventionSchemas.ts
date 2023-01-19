import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { globalBudgetSchema } from '../../../repositories/schemas/globalBudgetSchema';
import { interventionAnnualDistributionSchema } from '../../../repositories/schemas/interventionAnnualDistributionSchema';
import { externalReferenceSchema } from '../../../shared/domain/externalReferenceId/externalReferenceIdSchema';
import { EXECUTOR_DI } from '../../../shared/taxonomies/constants';
import { assetSchema } from '../../asset/mongo/assetSchemas';
import { auditSchema } from '../../audit/mongo/auditSchema';
import { commentSchema } from '../../comments/mongo/commentSchema';
import { designDataSchema } from '../../designData/mongo/designDataSchema';
import { interventionDocumentSchema } from '../../documents/mongo/documentSchema';

const interventionAreaSchema = {
  isEdited: Boolean,
  geometry: {
    type: Schema.Types.Mixed,
    required: true
  },
  geometryPin: {
    type: Schema.Types.Mixed,
    required: true
  }
};

const projectSchema = {
  id: {
    type: String,
    required: true
  },
  typeId: {
    type: String,
    required: true
  }
};

const decisionSchema = new Schema({
  typeId: {
    type: String,
    required: true
  },
  previousPlanificationYear: {
    type: Number,
    required: false
  },
  targetYear: {
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

export const enrichedInterventionSchema = new Schema(
  {
    _id: String,
    interventionName: {
      type: String,
      required: true
    },
    interventionTypeId: {
      type: String,
      required: true
    },
    workTypeId: {
      type: String,
      required: true
    },
    requestorId: {
      type: String,
      required: true
    },
    boroughId: {
      type: String,
      required: true
    },
    status: String,
    interventionYear: {
      type: Number,
      required: true
    },
    planificationYear: {
      type: Number,
      required: true
    },
    estimate: {
      type: globalBudgetSchema,
      required: true,
      default: undefined
    },
    programId: {
      type: String,
      required: false
    },
    contact: {
      type: String,
      required: false
    },
    medalId: {
      type: String,
      required: false,
      default: undefined
    },
    project: {
      type: projectSchema,
      required: false
    },
    comments: {
      type: [commentSchema],
      required: false,
      default: undefined
    },
    documents: {
      type: [interventionDocumentSchema],
      required: false,
      default: undefined
    },
    externalReferenceIds: {
      type: [externalReferenceSchema],
      required: false,
      default: undefined
    },
    executorId: {
      type: String,
      default: EXECUTOR_DI,
      required: true
    },
    roadNetworkTypeId: {
      type: String,
      required: false,
      default: undefined
    },
    decisions: {
      type: [decisionSchema],
      required: false,
      default: undefined
    },
    decisionRequired: {
      type: Boolean,
      required: false
    },
    assets: {
      type: [assetSchema],
      required: true,
      default: undefined
    },
    interventionArea: interventionAreaSchema,
    roadSections: {
      type: Schema.Types.Mixed,
      required: false
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
    annualDistribution: {
      type: interventionAnnualDistributionSchema,
      required: false,
      default: undefined
    },
    importRevisionDate: {
      type: Date,
      required: false
    },
    designData: {
      type: designDataSchema,
      required: false,
      default: undefined
    },
    audit: auditSchema,
    moreInformationAudit: auditSchema,
    __v: Number
  },
  {
    strict: false,
    collection: constants.mongo.collectionNames.INTERVENTIONS,
    versionKey: false
  }
);

import { Schema } from 'mongoose';

import { NexoImportStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../config/constants';
import { importErrorSchema } from '../../../shared/import/importErrorSchema';
import { auditSchema } from '../../audit/mongo/auditSchema';
import { INexoImportLogProps } from '../models/nexoImportLog';

const nexoImportElementItemSchemaDefinition = {
  id: {
    type: String,
    required: true
  },
  importStatus: {
    type: String,
    required: true
  },
  modificationType: {
    type: String,
    required: false
  },
  elementErrors: {
    type: [importErrorSchema],
    required: false
  }
};

const nexoImportProjectItem = new Schema(nexoImportElementItemSchemaDefinition, { _id: false });

const nexoImportInterventionItem = new Schema(
  {
    ...nexoImportElementItemSchemaDefinition,
    lineNumber: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const nexoImportFileItem = new Schema(
  {
    name: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true
    },
    id: {
      type: String,
      required: false
    },
    numberOfItems: {
      type: Number,
      required: false
    },
    fileErrors: {
      type: [importErrorSchema],
      required: false
    },
    projects: {
      type: [nexoImportProjectItem],
      required: false
    },
    interventions: {
      type: [nexoImportInterventionItem],
      required: false
    }
  },
  { _id: false }
);

export const nexoImportLogSchema = new Schema<INexoImportLogProps>(
  {
    audit: auditSchema,
    status: {
      type: String,
      required: true,
      default: NexoImportStatus.PENDING
    },
    files: {
      type: [nexoImportFileItem],
      required: true
    }
  },
  {
    strict: true,
    collection: constants.mongo.collectionNames.NEXO_IMPORT_LOGS,
    versionKey: false
  }
);

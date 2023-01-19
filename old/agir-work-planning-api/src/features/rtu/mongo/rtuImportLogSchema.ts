import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { importErrorSchema } from '../../../shared/import/importErrorSchema';
import { auditSchema } from '../../audit/mongo/auditSchema';
import { IRtuImportLogProps } from '../models/rtuImportLog';

const rtuProjectError = new Schema(
  {
    projectId: {
      type: String,
      required: true
    },
    projectNoReference: {
      type: String,
      required: true
    },
    projectName: {
      type: String,
      required: true
    },
    streetName: {
      type: String,
      required: true
    },
    streetFrom: {
      type: String,
      required: true
    },
    streetTo: {
      type: String,
      required: true
    },
    errorDetails: {
      type: [importErrorSchema],
      required: false
    }
  },
  { _id: false }
);

export const rtuImportLogSchema = new Schema<IRtuImportLogProps>(
  {
    startDateTime: Date,
    endDateTime: Date,
    audit: auditSchema,
    status: {
      type: String,
      required: true
    },
    errorDetail: importErrorSchema,
    failedProjects: {
      type: [rtuProjectError],
      required: false
    }
  },
  {
    strict: true,
    collection: constants.mongo.collectionNames.RTU_IMPORT_LOGS,
    versionKey: false
  }
);

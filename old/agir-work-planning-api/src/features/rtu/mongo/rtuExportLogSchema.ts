import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { importErrorSchema } from '../../../shared/import/importErrorSchema';
import { auditSchema } from '../../audit/mongo/auditSchema';
import { IRtuExportLogProps } from '../models/rtuExportLog';

const rtuProjectExport = new Schema(
  {
    _id: String,
    status: {
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

export const rtuExportLogSchema = new Schema<IRtuExportLogProps>(
  {
    startDateTime: Date,
    endDateTime: Date,
    audit: auditSchema,
    status: {
      type: String,
      required: true
    },
    errorDetail: importErrorSchema,
    projects: {
      type: [rtuProjectExport],
      required: false
    }
  },
  {
    strict: true,
    collection: constants.mongo.collectionNames.RTU_EXPORT_LOGS,
    versionKey: false
  }
);

import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';

export interface IBicImportLogAttributes {
  _id: string;
  audit: IAuditAttributes;
}
export const bicImportLogSchema = new Schema(
  {
    audit: auditSchema
  },
  {
    collection: constants.mongo.collectionNames.BIC_IMPORT_LOGS,
    versionKey: false
  }
);

import { Schema } from 'mongoose';

import { AnnualProgramStatus, Role } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../config/constants';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';
import { IProgramBookMongoAttributes } from '../../programBooks/mongo/programBookSchema';

export interface IAnnualProgramMongoAttributes {
  _id: string;
  executorId: string;
  year: number;
  budgetCap: number;
  status: AnnualProgramStatus;
  sharedRoles: Role[];
  limitedAccess: boolean;
  description: string;
  audit: IAuditAttributes;
  programBooks?: IProgramBookMongoAttributes[];
}

export const enrichedAnnualProgramSchema = new Schema(
  {
    executorId: {
      type: String,
      required: true
    },
    year: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: false
    },
    budgetCap: {
      type: Number,
      required: true
    },
    sharedRoles: {
      type: [String],
      required: false,
      default: undefined
    },
    status: {
      type: String,
      required: true
    },
    audit: auditSchema
  },
  {
    strict: true,
    collection: constants.mongo.collectionNames.ANNUAL_PROGRAMS,
    versionKey: false
  }
);

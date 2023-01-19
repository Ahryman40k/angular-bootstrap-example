import { Schema } from 'mongoose';

import {
  ProgramBookObjectiveTargetType,
  ProgramBookObjectiveType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';
import { IObjectiveValuesMongoAttributes, objectiveValuesSchema } from './objectiveValuesSchema';

export interface IObjectiveMongoAttributes {
  id: string;
  name: string;
  objectiveType: ProgramBookObjectiveType;
  targetType: ProgramBookObjectiveTargetType;
  requestorId: string;
  assetTypeIds: string[];
  workTypeIds: string[];
  values: IObjectiveValuesMongoAttributes;
  pin: boolean;
  audit: IAuditAttributes;
}

export const objectiveSchema = new Schema(
  {
    id: String,
    name: {
      type: String,
      required: true
    },
    objectiveType: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true
    },
    requestorId: {
      type: String,
      required: false
    },
    assetTypeIds: {
      type: [String],
      required: false
    },
    workTypeIds: {
      type: [String],
      required: false
    },
    values: {
      type: objectiveValuesSchema,
      required: true
    },
    pin: {
      type: Boolean,
      required: false,
      default: false
    },
    audit: auditSchema
  },
  {
    _id: false
  }
);

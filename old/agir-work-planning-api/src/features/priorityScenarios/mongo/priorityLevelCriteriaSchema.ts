import { Schema } from 'mongoose';

import { IServicePriorityAttributes, servicePrioritySchema } from '../../servicePriority/mongo/servicePrioritySchema';
import {
  IProjectCategoryCriteriaMongoAttributes,
  projectCategoryCriteriaSchema
} from './projectCategoryCriteriaSchema';

export interface IPriorityLevelCriteriaMongoAttributes {
  projectCategory: IProjectCategoryCriteriaMongoAttributes[];
  workTypeId: string[];
  requestorId: string[];
  assetTypeId: string[];
  interventionType: string[];
  servicePriorities: IServicePriorityAttributes[];
}

export const criteriaSchema = new Schema(
  {
    projectCategory: {
      type: [projectCategoryCriteriaSchema],
      required: false,
      default: undefined
    },
    workTypeId: {
      type: [String],
      required: false
    },
    requestorId: {
      type: [String],
      required: false
    },
    assetTypeId: {
      type: [String],
      required: false
    },
    interventionType: {
      type: [String],
      required: false
    },
    servicePriorities: {
      type: [servicePrioritySchema],
      required: false,
      default: undefined
    }
  },
  { _id: false }
);

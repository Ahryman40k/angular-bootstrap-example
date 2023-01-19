import { Schema } from 'mongoose';

import { criteriaSchema, IPriorityLevelCriteriaMongoAttributes } from './priorityLevelCriteriaSchema';
import { IPriorityLevelSortCriteriaMongoAttributes, sortCriteriaSchema } from './priorityLevelSortCriteriaSchema';

export interface IPriorityLevelMongoAttributes {
  rank: number;
  isSystemDefined: boolean;
  criteria: IPriorityLevelCriteriaMongoAttributes;
  projectCount: number;
  sortCriterias: IPriorityLevelSortCriteriaMongoAttributes[];
}
export const priorityLevelSchema = new Schema(
  {
    rank: {
      type: Number,
      required: true
    },
    isSystemDefined: {
      type: Boolean,
      required: true
    },
    criteria: {
      type: criteriaSchema,
      required: true
    },
    projectCount: {
      type: Number,
      required: true
    },
    sortCriterias: {
      type: [sortCriteriaSchema],
      required: true
    }
  },
  { _id: false }
);

import { Schema } from 'mongoose';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';
import { IOrderedProjectMongoAttributes, orderedProjectsSchema } from './orderedProjectSchema';
import { IPriorityLevelMongoAttributes, priorityLevelSchema } from './priorityLevelSchema';

// TODO SET UP REAL PRRIORITY SCENARIO ATTRIBUTES
export interface IPriorityScenarioMongoAttributes {
  id: string;
  name: string;
  priorityLevels: IPriorityLevelMongoAttributes[];
  orderedProjects: IOrderedProjectMongoAttributes[];
  isOutdated: boolean;
  status: string;
  audit: IAuditAttributes;
}
export const priorityScenarioSchema = new Schema(
  {
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    priorityLevels: {
      type: [priorityLevelSchema],
      required: true
    },
    orderedProjects: {
      type: [orderedProjectsSchema],
      required: false
    },
    isOutdated: {
      type: Boolean,
      required: false
    },
    status: {
      type: String,
      required: true
    },
    audit: auditSchema
  },
  { _id: false }
);

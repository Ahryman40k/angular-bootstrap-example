import { ProgramBookStatus, ProjectType, Role } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Schema } from 'mongoose';

import { constants } from '../../../../config/constants';
import { auditSchema, IAuditAttributes } from '../../audit/mongo/auditSchema';
import {
  IPriorityScenarioMongoAttributes,
  priorityScenarioSchema
} from '../../priorityScenarios/mongo/priorityScenarioSchema';
import { IObjectiveMongoAttributes, objectiveSchema } from './objectiveSchema';

export interface IProgramBookMongoAttributes {
  _id: string;
  name: string;
  projectTypes: ProjectType[];
  boroughIds: string[];
  removedProjectsIds: string[];
  annualProgramId: string;
  inCharge: string;
  status: ProgramBookStatus;
  priorityScenarios: IPriorityScenarioMongoAttributes[];
  objectives: IObjectiveMongoAttributes[];
  sharedRoles: Role[];
  audit: IAuditAttributes;
  programTypes: string[];
  description: string;
  isAutomaticLoadingInProgress: boolean;
}

export const programBookSchema = new Schema<IProgramBookMongoAttributes>(
  {
    annualProgramId: {
      type: Schema.Types.ObjectId,
      ref: 'annual_programs',
      required: true
    },
    audit: auditSchema,
    name: {
      type: String,
      required: true
    },
    projectTypes: {
      type: [String],
      required: true
    },
    inCharge: {
      type: String,
      required: false
    },
    boroughIds: {
      type: [String],
      required: false
    },
    objectives: {
      type: [objectiveSchema],
      required: false
    },
    removedProjectsIds: {
      type: [String],
      required: false
    },
    sharedRoles: {
      type: [String],
      required: false,
      default: undefined
    },
    priorityScenarios: {
      type: [priorityScenarioSchema],
      required: false
    },
    programTypes: {
      type: [String],
      required: false
    },
    description: {
      type: String,
      required: false
    },
    status: {
      type: String,
      required: true
    },
    isAutomaticLoadingInProgress: {
      type: Boolean,
      required: true
    }
  },
  {
    strict: true,
    collection: constants.mongo.collectionNames.PROGRAM_BOOKS,
    versionKey: false
  }
);

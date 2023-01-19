import { SubmissionProgressStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { IDocumentMongoAttributes } from '../../documents/mongo/documentSchema';
import { IProgressHistoryItemAttributes } from './progressHistoryItemSchema';
import { IRequirementMongoAttributes } from './requirementSchema';
import { IStatusHistoryItemAttributes } from './statusHistoryItemSchema';
import { submissionSchema } from './submissionSchema';

export interface ISubmissionAttributes {
  _id: string;
  drmNumber: string;
  programBookId: string;
  projectIds: string[];
  status: string;
  progressStatus: SubmissionProgressStatus;
  documents: IDocumentMongoAttributes[];
  statusHistory: IStatusHistoryItemAttributes[];
  progressHistory: IProgressHistoryItemAttributes[];
  requirements: IRequirementMongoAttributes[];
  audit: IAuditAttributes;
}

export type ISubmissionMongoDocument = ISubmissionAttributes & Document;
export type SubmissionModel = CustomModel<ISubmissionAttributes>;

export const submissionModelFactory = (mongoose: Connection) => {
  const submissionModel = mongoose.model<ISubmissionMongoDocument>(
    constants.mongo.collectionNames.SUBMISSIONS,
    submissionSchema
  ) as SubmissionModel;
  submissionModel.schema = submissionSchema;
  submissionModel.hasObjectId = false;

  submissionModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return submissionModel;
};

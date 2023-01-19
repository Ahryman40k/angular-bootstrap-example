import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IAssetAttributes } from '../../asset/mongo/assetSchemas';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import {
  IOpportunityNoticeNoteAttributes,
  IOpportunityNoticeResponseAttributes,
  opportunityNoticeSchema
} from './opportunityNoticeSchema';

// TODO
// A Model Attributes should be clearly defined so that we know exactly what we have in DB
// the toPersistance(domain) method will do the mapping
// Add properties attribute interfaces like IOpportunityNoticeNoteAttributes for all props
// tslint:disable:no-empty-interface
export interface IOpportunityNoticeMongoAttributes {
  _id: string;
  assets: IAssetAttributes[];
  contactInfo?: string;
  followUpMethod: string;
  maxIterations: number;
  object: string;
  projectId: string;
  requestorId: string;
  status: string;
  workTypeId?: string;
  response?: IOpportunityNoticeResponseAttributes;
  audit: IAuditAttributes;
  notes?: IOpportunityNoticeNoteAttributes[];
}

export type IOpportunityNoticeMongoDocument = IOpportunityNoticeMongoAttributes & Document;
export type OpportunityNoticeModel = CustomModel<IOpportunityNoticeMongoAttributes>;

export const opportunityNoticeModelFactory = (mongoose: Connection) => {
  const opportunityNoticeModel = mongoose.model<IOpportunityNoticeMongoDocument>(
    constants.mongo.collectionNames.OPPORTUNITY_NOTICES,
    opportunityNoticeSchema
  ) as OpportunityNoticeModel;
  opportunityNoticeModel.schema = opportunityNoticeSchema;

  opportunityNoticeModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return opportunityNoticeModel;
};

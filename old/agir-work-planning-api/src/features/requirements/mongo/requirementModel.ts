import { IRequirement } from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IAuditAttributes } from '../../audit/mongo/auditSchema';
import { requirementSchema } from './requirementSchemas';

export interface IRequirementMongoAttributes {
  _id: string;
  typeId: string;
  subtypeId: string;
  text: string;
  items: IRequirementItemAttributes[];
  audit: IAuditAttributes;
}
export interface IRequirementItemAttributes {
  id: string;
  type: string;
}

export type IRequirementMongoDocument = IRequirement & Document;
export type RequirementModel = CustomModel<IRequirement>;

export const requirementModelFactory = (mongoose: Connection) => {
  const requirementModel = mongoose.model<IRequirementMongoDocument>(
    constants.mongo.collectionNames.REQUIREMENTS,
    requirementSchema
  ) as RequirementModel;
  requirementModel.schema = requirementSchema;

  requirementModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return requirementModel;
};

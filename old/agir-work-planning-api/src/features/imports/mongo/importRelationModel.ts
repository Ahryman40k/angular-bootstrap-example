import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { IImportRelation, importRelationSchema } from './projectImportRelationSchema';

export type IImportRelationMongoDocument = IImportRelation & Document;
export type ImportRelationModel = CustomModel<IImportRelation>;

export const importRelationModelFactory = (mongoose: Connection) => {
  const importRelationModel = mongoose.model<IImportRelationMongoDocument>(
    constants.mongo.collectionNames.IMPORT_RELATIONS,
    importRelationSchema
  ) as ImportRelationModel;
  importRelationModel.schema = importRelationSchema;
  importRelationModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return importRelationModel;
};

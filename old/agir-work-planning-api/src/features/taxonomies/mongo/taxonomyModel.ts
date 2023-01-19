import { ITaxonomy } from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';
import { constants } from '../../../../config/constants';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { taxonomySchema } from './taxonomySchemas';

export type ITaxonomyMongoDocument = ITaxonomy & Document;
export type TaxonomyModel = CustomModel<ITaxonomy>;

export const taxonomyModelFactory = (mongoose: Connection) => {
  const taxonomyModel = mongoose.model<ITaxonomyMongoDocument>(
    constants.mongo.collectionNames.TAXONOMIES,
    taxonomySchema
  ) as TaxonomyModel;
  taxonomyModel.schema = taxonomySchema;

  taxonomyModel.lookups = (aggregate, expand: string[] = []) => {
    return;
  };
  return taxonomyModel;
};

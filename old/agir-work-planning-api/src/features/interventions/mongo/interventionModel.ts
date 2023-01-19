import { InterventionExpand } from '@villemontreal/agir-work-planning-lib';
import { Connection, Document } from 'mongoose';

import { constants } from '../../../../config/constants';
import { alphaNumericIdIncPlugin } from '../../../middlewares/alphaNumericIdIncPlugin';
import { CustomModel } from '../../../repositories/mongo/customModel';
import { getProjectsLookup } from '../../projects/mongo/projectModel';
import { IInterventionAttributes } from './interventionAttributes';
import { enrichedInterventionSchema } from './interventionSchemas';

export type IInterventionMongoDocument = IInterventionAttributes & Document;
export type InterventionModel = CustomModel<IInterventionAttributes>;

export const interventionModelFactory = (mongoose: Connection) => {
  enrichedInterventionSchema.plugin(alphaNumericIdIncPlugin, {
    key: constants.mongo.collectionNames.INTERVENTIONS,
    prefix: 'I'
  });

  const interventionModel = mongoose.model<IInterventionMongoDocument>(
    constants.mongo.collectionNames.INTERVENTIONS,
    enrichedInterventionSchema
  ) as InterventionModel;
  interventionModel.schema = enrichedInterventionSchema;

  // hasObjectId as false
  interventionModel.hasObjectId = false;

  // Set lookups with expands
  interventionModel.lookups = (aggregate, expand: InterventionExpand[] = []) => {
    if (expand.includes(InterventionExpand.project)) {
      aggregate.lookup({
        ...getProjectsLookup()
      });
    }
  };

  return interventionModel;
};

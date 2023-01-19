import { PriorityCode } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { InterventionModel } from '../../../../features/interventions/mongo/interventionModel';
import { enumValues } from '../../../../utils/enumUtils';
import { createLogger } from '../../../../utils/logger';

/**
 * For V2.4.5 we need to update interventions
 */
const logger = createLogger('mongo/2.4.5');
let interventionCollection: MongoDb.Collection<InterventionModel>;
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = new Date().getTime();
  interventionCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  await updateInterventions();
  const milliseconds = new Date().getTime() - startTime;
  logger.info(`Script 2.4.5 executed in ${milliseconds} milliseconds`);
}

async function updateInterventions(): Promise<void> {
  const priorityIds = enumValues(PriorityCode);
  await interventionCollection.updateMany(
    {
      priorityId: { $nin: priorityIds }
    },
    {
      $set: { priorityId: PriorityCode.lowPriority }
    }
  );
}

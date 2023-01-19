import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.6.3');

/**
 * For V2.6.3 we need to delete the priorityId from projects and interventions
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const projectsCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
  const interventionsCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  await deleteCollectionPriorityIds(projectsCollection);
  await deleteCollectionPriorityIds(interventionsCollection);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.6.3 executed in ${milliseconds} milliseconds`);
}

async function deleteCollectionPriorityIds(collection: MongoDb.Collection): Promise<void> {
  logger.info(`Delete ${collection.collectionName} priority ids`);
  try {
    const updateResult = await collection.updateMany({}, { $unset: { priorityId: 1, calculatedPriority: 1 } });
    logger.info(`${updateResult.upsertedCount} documents from ${collection.collectionName} collection updated`);
  } catch (e) {
    logger.error(`Delete ${collection.collectionName} priority ids error -> ${e}`);
  }
}

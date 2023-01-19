import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.61');
let INTERVENTIONS_COLLECTION: Collection;
let PROJECTS_COLLECTION: Collection;

/**
 * For V2.7.61 we need to remove constraints attribute of interventions and projects
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);

  await removeConstraintsAttributeFromCollection(INTERVENTIONS_COLLECTION);
  await removeConstraintsAttributeFromCollection(PROJECTS_COLLECTION);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.61 executed in ${milliseconds} milliseconds`);
}

async function removeConstraintsAttributeFromCollection(collection: Collection): Promise<void> {
  logger.info('Start removing constraints attribute from collection');
  try {
    await collection.updateMany({}, { $unset: { constraints: 1 } });
    logger.info(`Constraints attribute removed from collection`);
  } catch (e) {
    logger.error(`Error removing constraints attribute from collection -> ${e}`);
  }
}

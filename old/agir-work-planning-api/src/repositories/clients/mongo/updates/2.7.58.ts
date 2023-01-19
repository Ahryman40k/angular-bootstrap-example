import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.58');
let TAXONOMIES_COLLECTION: Collection;
let CONSTRAINT_COLLECTION: Collection;

/**
 * For V2.7.58 we need to remove constraints
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  CONSTRAINT_COLLECTION = db.collection('constraints');

  await removeConstraintTypeTaxonomyGroup();
  await deleteConstraintCollection();

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.58 executed in ${milliseconds} milliseconds`);
}

async function removeConstraintTypeTaxonomyGroup(): Promise<void> {
  logger.info('Start removing constraintType group from taxonomy');

  try {
    await TAXONOMIES_COLLECTION.deleteMany({ group: 'constraintType' });
    logger.info(`constraintType group removed from taxonomy`);
  } catch (e) {
    logger.error(`Error removing constraintType group from taxonomy -> ${e}`);
  }
}

async function deleteConstraintCollection(): Promise<void> {
  if (CONSTRAINT_COLLECTION) {
    try {
      logger.info('Start deleting constraint collection');
      await CONSTRAINT_COLLECTION.drop();
      logger.info(`Constraint collection deleted`);
    } catch (e) {
      logger.error(`Error deleting constraint colleciton -> ${e}`);
    }
  }
}

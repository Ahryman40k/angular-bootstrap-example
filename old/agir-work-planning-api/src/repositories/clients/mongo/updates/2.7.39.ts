import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.39');
let TAXONOMIES_COLLECTION: Collection;

/**
 * For V2.7.39 update intervention requirements
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

    const result = await TAXONOMIES_COLLECTION.deleteOne({
      group: 'interventionRequirementType',
      code: 'noConflict'
    });
    logger.info(`${result.deletedCount} intervention requirement type noConflict DELETED`);

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.39 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

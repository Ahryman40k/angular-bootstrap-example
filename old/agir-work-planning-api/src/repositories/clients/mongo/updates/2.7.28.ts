import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.28');
let COUNTERS_COLLECTION: Collection;
/**
 * For V2.7.28 we need to update the counter for Drm.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  COUNTERS_COLLECTION = db.collection(constants.mongo.collectionNames.COUNTERS);
  await addDrmCounter();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.28 executed in ${milliseconds} milliseconds`);
}

async function addDrmCounter(): Promise<void> {
  logger.info('UPDATE COUNTERS STARTED');
  await COUNTERS_COLLECTION.insertOne({
    key: 'drm',
    sequence: 4999,
    availableValues: [],
    __v: 0
  });
  logger.info('UPDATE COUNTERS DONE');
}

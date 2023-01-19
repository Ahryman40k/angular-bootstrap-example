import { Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.9`;
const logger = createLogger(`mongo/${VERSION}`);

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const usersPreferencesCollection = db.collection(constants.mongo.collectionNames.USERS_PREFERENCES);

  logger.info(
    `Deleting entries in ${constants.mongo.collectionNames.USERS_PREFERENCES} related to favorite objectives`
  );
  let result;
  try {
    result = await usersPreferencesCollection.deleteMany({ key: 'favorite-objectives' });
  } catch (e) {
    logger.info('Error: ' + e);
  }
  logger.info(`Deleted ${result.deletedCount} entries from ${constants.mongo.collectionNames.USERS_PREFERENCES}`);
  logger.info(`Script ${VERSION} executed in ${Date.now() - startTime} milliseconds`);
}

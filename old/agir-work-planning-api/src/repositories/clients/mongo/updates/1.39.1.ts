import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.39.1');
/**
 * For V1.39.1 we all the mapAssetLogicLayer taxonomies.
 * The goal is to hide all assets from the FE application.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  logger.info('Deleting all mapAssetLogicLayer taxonomies.');
  const result = await db.collection(constants.mongo.collectionNames.TAXONOMIES).deleteMany({
    group: 'mapAssetLogicLayer'
  });
  logger.info(`Deleted ${result.deletedCount} mapAssetLogicLayer taxonomies.`);
}

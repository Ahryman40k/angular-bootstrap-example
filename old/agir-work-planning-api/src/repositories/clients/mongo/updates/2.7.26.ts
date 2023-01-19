import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.26');
let taxonomiesCollection: MongoDb.Collection;

/**
 * For V2.7.26 we need to remove invalid properties from taxonomies
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await updateTaxonomies();

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.26 executed in ${milliseconds} milliseconds`);
}

async function updateTaxonomies(): Promise<void> {
  logger.info(`Remove property "NouvelleValeur" from taxonomies collection`);
  try {
    const updateResults = await taxonomiesCollection.updateMany(
      { NouvelleValeur: { $exists: true } },
      { $unset: { NouvelleValeur: '' } }
    );
    logger.info(`${updateResults.modifiedCount} documents updated in taxonomies collection`);
  } catch (e) {
    logger.info(`Update taxonomies error -> ${e}`);
  }
}

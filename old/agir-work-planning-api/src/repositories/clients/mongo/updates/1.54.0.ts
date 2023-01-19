import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.54.0');

/**
 * For V1.54.0 we need to remote 'revisionRoadNetworks' from taxonomy group 'mapAssetLogicLayer'.
 * We are removing current map layer.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await removeRevisionRoadNetworks(taxonomiesCollection);
}

async function removeRevisionRoadNetworks(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Deleting taxonomy group mapAssetLogicLayer, code revisionRoadNetworks.`);

  const layer = {
    group: 'mapAssetLogicLayer',
    code: 'revisionRoadNetworks'
  };
  await taxonomiesCollection.deleteOne(layer);
}

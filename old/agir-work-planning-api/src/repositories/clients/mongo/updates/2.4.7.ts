import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.4.6');

/**
 * For V2.4.6 we need to add 'revisionRoadNetworks' and 'parks' from taxonomy group 'mapAssetLogicLayer'.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await addRevisionRoadNetworks(taxonomiesCollection);
  await addParks(taxonomiesCollection);
}

async function addRevisionRoadNetworks(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy group mapAssetLogicLayer, code revisionRoadNetworks.`);

  const layer = {
    group: 'mapAssetLogicLayer',
    code: 'revisionRoadNetworks',
    displayOrder: 1610,
    label: {
      en: 'Road networks in revision',
      fr: 'Réseaux en revision voirie'
    }
  };

  await taxonomiesCollection.deleteOne(layer);
  await taxonomiesCollection.insertOne(layer);
}

async function addParks(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy group mapAssetLogicLayer, code parks.`);

  const layer = {
    group: 'mapAssetLogicLayer',
    code: 'parks',
    displayOrder: 1000,
    label: {
      en: 'Parks',
      fr: 'Parcs'
    }
  };
  await taxonomiesCollection.deleteOne(layer);
  await taxonomiesCollection.insertOne(layer);
}

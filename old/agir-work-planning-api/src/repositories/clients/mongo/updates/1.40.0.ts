import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.40.0');

/**
 * For V1.40.0 we need to create and update 'mapAssetLogicLayer' taxonomies.
 * We are integrating new map layers.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await setRoadsTaxonomies(taxonomiesCollection);
  await setSidewalkTaxonomies(taxonomiesCollection);
  await renameAqueducsToAqueducts(taxonomiesCollection);
  await renameEgoutsToSewers(taxonomiesCollection);
  await setSewerManholeTaxonomies(taxonomiesCollection);
  await addAssetTypePavementIntersections(taxonomiesCollection);
  await addAssetTypePavementIslands(taxonomiesCollection);
}

async function setRoadsTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy group mapAssetLogicLayer, code pavement.`);
  await taxonomiesCollection.insert({
    group: 'mapAssetLogicLayer',
    code: 'pavement',
    displayOrder: 0,
    label: {
      fr: 'Chaussées de la voirie',
      en: 'Road Pavements'
    }
  });

  logger.info(`Updating taxonomy group assetType, code roadway.`);
  await taxonomiesCollection.update(
    { group: 'assetType', code: 'roadway' },
    { $set: { 'properties.sourcesLayerId': 'chaussees' } }
  );
}

async function setSidewalkTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy group mapAssetLogicLayer, code sidewalk.`);
  await taxonomiesCollection.insert({
    group: 'mapAssetLogicLayer',
    code: 'sidewalk',
    displayOrder: 2,
    label: {
      fr: 'Trottoir',
      en: 'Sidewalk'
    }
  });

  logger.info(`Updating taxonomy group assetType, code sidewalk.`);
  await taxonomiesCollection.update(
    { group: 'assetType', code: 'sidewalk' },
    { $set: { 'properties.sourcesLayerId': 'trottoirs' } }
  );
}

async function renameAqueducsToAqueducts(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Updating taxonomy group mapAssetLogicLayer, code aqueducts.`);
  await taxonomiesCollection.update({ group: 'mapAssetLogicLayer', code: 'aqueducs' }, { $set: { code: 'aqueducts' } });
}

async function renameEgoutsToSewers(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Updating taxonomy group mapAssetLogicLayer, code aqueducts.`);
  await taxonomiesCollection.update({ group: 'mapAssetLogicLayer', code: 'egouts' }, { $set: { code: 'sewers' } });
}

async function setSewerManholeTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy group mapAssetLogicLayer, code sewerManhole.`);
  await taxonomiesCollection.insert({
    group: 'mapAssetLogicLayer',
    code: 'sewerManhole',
    displayOrder: 6,
    label: {
      fr: `Regard d'égoût`,
      en: 'Sewer manhole'
    }
  });

  logger.info(`Update taxonomy group assetType, code sewerManhole.`);
  await taxonomiesCollection.update(
    { group: 'assetType', code: 'sewerManhole' },
    { $set: { 'properties.sourcesLayerId': 'regards-egouts' } }
  );
}

async function addAssetTypePavementIntersections(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  const newAssetType = {
    group: 'assetType',
    code: 'roadway-intersection',
    label: {
      fr: 'Intersection chaussée',
      en: 'Roadway intersection'
    },
    properties: {
      idKey: 'id',
      namespace: 'montreal',
      owners: ['publicWorksRoad', 'mtq'],
      sourcesLayerId: 'intersections',
      workTypes: ['construction', 'reconstruction', 'rehabilitation', 'pulvoStabilization', 'cutResurfacing']
    }
  };
  await taxonomiesCollection.insert(newAssetType);
}

async function addAssetTypePavementIslands(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  const newAssetType = {
    group: 'assetType',
    code: 'roadway-islands',
    label: {
      fr: 'Ilôts de chaussée',
      en: 'Roadway islands'
    },
    properties: {
      idKey: 'id',
      namespace: 'montreal',
      owners: ['publicWorksRoad', 'mtq'],
      sourcesLayerId: 'ilots',
      workTypes: ['construction', 'reconstruction', 'rehabilitation', 'pulvoStabilization', 'cutResurfacing']
    }
  };
  await taxonomiesCollection.insert(newAssetType);
}

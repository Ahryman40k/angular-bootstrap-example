import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.6.4');

export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await updateAssetTypeTaxonomies(taxonomiesCollection);
}

// AssetType that are NOT consultationOnly
const mapAssetTypeNotConsultationOnly: string[] = [
  'gas',
  'roadway',
  'bikePath',
  'sewerManhole',
  'sewerChamber',
  'aqueductValve',
  'sewerSegment',
  'sidewalk',
  'aqueductSegment',
  'park',
  'roadway-intersection',
  'roadway-islands',
  'aqueductValveChamber',
  'roadNetworkNode',
  'csemStructure',
  'csemMassive',
  'alley'
];

async function updateAssetTypeTaxonomies(collection: MongoDb.Collection) {
  logger.info('Add new attribute consultationOnly of asset types');
  try {
    const assetTypes: ITaxonomy[] = await collection.find({ group: 'assetType' }).toArray();

    for (const assetType of assetTypes) {
      // by default,  consultationOnly
      assetType.properties.consultationOnly = true;

      // Search for the assetType that need to be NOT consultationOnly
      if (mapAssetTypeNotConsultationOnly.findIndex((asset: string) => asset === assetType.code) >= 0) {
        assetType.properties.consultationOnly = false;
      }

      await collection.replaceOne({ group: assetType.group, code: assetType.code }, assetType);
      logger.info(
        `assetType code = ${assetType.code} properties.consultationOnly  =  ${assetType.properties.consultationOnly}`
      );
    }
  } catch (e) {
    logger.error(`Update asset types error -> ${e}`);
  }
}

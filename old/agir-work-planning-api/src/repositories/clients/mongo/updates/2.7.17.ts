import * as MongoDb from 'mongodb';

import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.17');

/**
 * For V2.7.17 update the assetType that had properties.consultationOnly = "true"/"false"  to boolean true/false
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await updateAssetType(taxonomiesCollection);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.17 executed in ${milliseconds} milliseconds`);
}

async function updateAssetType(collection: MongoDb.Collection): Promise<void> {
  logger.info(
    `Update  ${collection.collectionName}  assetType.properties.consutltationOnly "true"/"false"  to boolean true/false`
  );
  try {
    let updateResult = await collection.updateMany(
      {
        group: TaxonomyGroup.assetType,
        'properties.consultationOnly': 'true'
      },
      {
        $set: {
          'properties.consultationOnly': true
        }
      }
    );

    logger.info(
      `${updateResult.upsertedCount} documents from ${collection.collectionName} collection updated assetType.properties.consutltationOnly from "true " to true `
    );

    updateResult = await collection.updateMany(
      {
        group: TaxonomyGroup.assetType,
        'properties.consultationOnly': 'false'
      },
      {
        $set: {
          'properties.consultationOnly': false
        }
      }
    );

    logger.info(
      `${updateResult.upsertedCount} documents from ${collection.collectionName} collection updated assetType.properties.consutltationOnly from "false" to false `
    );
  } catch (e) {
    logger.error(`Delete ${collection.collectionName} priority ids error -> ${e}`);
  }
}

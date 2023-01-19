import * as MongoDb from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.0.0');

/**
 * Updates app schema to version 1.0.0
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  // ==========================================
  // Creating the "interventions" collection.
  // ==========================================

  logger.info(` > Creating the "${constants.mongo.collectionNames.INTERVENTIONS}" collection.`);
  const interventionCollection: MongoDb.Collection = await db.createCollection(
    constants.mongo.collectionNames.INTERVENTIONS
  );

  // ==========================================
  // Creating indexes for the "interventions" collection.
  //
  // @see https://docs.mongodb.com/manual/reference/command/createIndexes/
  // ==========================================
  logger.info(` > Creating index for "${constants.mongo.collectionNames.INTERVENTIONS}" collection.`);
  await interventionCollection.createIndexes([
    {
      key: {
        'asset.geometry': '2dsphere'
      },
      name: 'asset_geometry_index'
    },
    {
      key: {
        'interventionArea.geometry': '2dsphere'
      },
      name: 'interventionArea_geometry_index'
    },
    {
      key: {
        'roadSections.features.geometry': '2dsphere'
      },
      name: 'roadSections_features_geometry_index'
    },
    {
      key: {
        status: 1
      },
      name: 'status_index'
    },
    {
      key: {
        interventionYear: 1
      },
      name: 'interventionYear_index'
    },
    {
      key: {
        'asset.id': 1
      },
      name: 'asset_id_index'
    }
  ]);
}

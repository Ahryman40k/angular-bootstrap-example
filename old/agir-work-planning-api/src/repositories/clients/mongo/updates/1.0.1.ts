import * as MongoDb from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.0.1');

/**
 * Updates app schema to version 1.0.0
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  // ==========================================
  // Creating the "Taxonomies" collection.
  // ==========================================

  logger.info(` > Creating the "${constants.mongo.collectionNames.TAXONOMIES}" collection.`);
  const taxonomyCollection: MongoDb.Collection = await db.createCollection(constants.mongo.collectionNames.TAXONOMIES);

  // ==========================================
  // Creating indexes for the "taxonomies" collection.
  //
  // @see https://docs.mongodb.com/manual/reference/command/createIndexes/
  // ==========================================
  await taxonomyCollection.createIndexes([
    {
      key: {
        code: 1,
        group: 1
      },
      name: 'code_1',
      unique: true
    }
  ]);
}

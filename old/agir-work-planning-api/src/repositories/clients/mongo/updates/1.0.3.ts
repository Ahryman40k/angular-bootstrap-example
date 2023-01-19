import * as MongoDb from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.0.3');

/**
 * Updates app schema to version 1.0.3
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  // ==========================================
  // Creating the "History" collection.
  // ==========================================

  logger.info(` > Creating the "${constants.mongo.collectionNames.HISTORY}" collection.`);
  const historyCollection: MongoDb.Collection = await db.createCollection(constants.mongo.collectionNames.HISTORY);

  // ==========================================
  // Creating indexes for the "taxonomies" collection.
  //
  // @see https://docs.mongodb.com/manual/reference/command/createIndexes/
  // ==========================================
  await historyCollection.createIndexes([
    {
      key: {
        referenceId: 1
      },
      name: 'referenceId_1',
      unique: false
    }
  ]);
}

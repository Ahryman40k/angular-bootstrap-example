import * as MongoDb from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.0.7');

/**
 * Updates app schema to version 1.0.7
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  // ==========================================
  // Creating the "Projects" collection.
  // ==========================================

  logger.info(` > Creating the "${constants.mongo.collectionNames.PROJECTS}" collection.`);
  const projectCollection: MongoDb.Collection = await db.createCollection(constants.mongo.collectionNames.PROJECTS);

  // ==========================================
  // Creating indexes for the "Projects" collection.
  //
  // @see https://docs.mongodb.com/manual/reference/command/createIndexes/
  // ==========================================
  await projectCollection.createIndexes([
    {
      key: {
        geometry: '2dsphere'
      },
      name: 'geometry_index'
    }
  ]);
}

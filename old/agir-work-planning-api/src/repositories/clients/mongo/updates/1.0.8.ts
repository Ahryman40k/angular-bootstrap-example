import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.0.8');

/**
 * Updates app schema to version 1.0.8
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  // ==========================================
  // Updating indexes in "Projects" collection.
  // ==========================================

  logger.info(` > Updating indexes for "${constants.mongo.collectionNames.PROJECTS}" collection.`);
  const projectCollection: MongoDb.Collection = db.collection(constants.mongo.collectionNames.PROJECTS);

  // ==========================================
  // Creating indexes for the "Projects" collection.
  //
  // @see https://docs.mongodb.com/manual/reference/command/createIndexes/
  // ==========================================
  await projectCollection.createIndexes([
    {
      key: {
        status: 1
      },
      name: 'status_index'
    },
    {
      key: {
        startYear: 1
      },
      name: 'startYear_index'
    }
  ]);
}

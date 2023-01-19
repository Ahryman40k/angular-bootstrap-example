import * as MongoDb from 'mongodb';

import { createLogger } from '../../../../utils/logger';
import { MongoMigrationService } from '../utils/mongo-migration-service';

const logger = createLogger('mongo/1.51.2');

/**
 * Updates the database to version 1.51.2.
 * In this version we delete all data.
 * That means every collection will be emptied except "taxonomies" and "appSchema".
 * @param db The database object from MongoDB
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const mongoMigrationService = new MongoMigrationService(logger, db);
  await mongoMigrationService.deleteCollectionsData();
}

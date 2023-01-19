import * as MongoDb from 'mongodb';

import { createLogger } from '../../../../utils/logger';
import { MongoMigrationService } from '../utils/mongo-migration-service';

const logger = createLogger('mongo/1.39.2');

/**
 * For V1.39.2 we clean the DB data.
 * We will delete all collections but appSchema and taxonomies.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const mongoMigrationService = new MongoMigrationService(logger, db);
  await mongoMigrationService.deleteCollectionsData();
}

import * as MongoDb from 'mongodb';

import { createLogger } from '../../../../utils/logger';
import { MongoMigrationService } from '../utils/mongo-migration-service';

const logger = createLogger('mongo/1.34.0');

/**
 * For V1.34.0 we are going to Prod and we need to delete all data.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const service = new MongoMigrationService(logger, db);
  await service.deleteCollectionsData();
}

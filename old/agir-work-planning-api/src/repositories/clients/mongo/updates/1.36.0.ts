import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { MongoMigrationService } from '../utils/mongo-migration-service';

const logger = createLogger('mongo/1.36.0');

/**
 * For V1.36.0 we are going to Prod and we need to delete all data except collections related to program books..
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const service = new MongoMigrationService(logger, db);
  const exceptions = [
    constants.mongo.collectionNames.PROGRAM_BOOKS,
    constants.mongo.collectionNames.PROGRAM_BOOKS_HISTORICALS
  ];
  await service.deleteCollectionsData(exceptions);
}

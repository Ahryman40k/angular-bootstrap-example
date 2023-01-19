import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.50');
let PROGRAM_BOOKS_COLLECTION: MongoDb.Collection;
/**
 * Add boolean to program book for the property isAutomaticLoadingInProgress
 * @param db
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = new Date().getTime();
  PROGRAM_BOOKS_COLLECTION = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  await updateProgramBooks();
  const milliseconds = new Date().getTime() - startTime;
  logger.info(`Script 2.7.50 executed in ${milliseconds} milliseconds`);
}

async function updateProgramBooks(): Promise<void> {
  logger.info(`Update program books collection`);
  try {
    const result = await PROGRAM_BOOKS_COLLECTION.updateMany(
      { isAutomaticLoadingInProgress: { $exists: false } },
      { $set: { isAutomaticLoadingInProgress: false } }
    );
    logger.info(`Collection ${PROGRAM_BOOKS_COLLECTION} (modified) = ${result.modifiedCount}`);
    logger.info(`Collection ${PROGRAM_BOOKS_COLLECTION} (matched) = ${result.matchedCount}`);
  } catch (e) {
    logger.info(`Update program books error -> ${e}`);
  }
}

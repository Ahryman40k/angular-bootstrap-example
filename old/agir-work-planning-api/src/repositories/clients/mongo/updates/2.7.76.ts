import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.76`;
const logger = createLogger(`mongo/${VERSION}`);

let PROGRAM_BOOK_COLLECTION: Collection;

/**
 * For V2.7.76 we need to remove objective which has bid as targetType
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  PROGRAM_BOOK_COLLECTION = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);

  await updateProgramBooks();
  await assertResults();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateProgramBooks(): Promise<void> {
  const result = await PROGRAM_BOOK_COLLECTION.updateMany(
    { 'objectives.targetType': 'bid' },
    {
      $pull: {
        objectives: {
          targetType: 'bid'
        }
      }
    }
  );
  logger.info(`End migration of programBooks ,  number of updated programBooks :   ${result.modifiedCount}`);
}

async function assertResults(): Promise<void> {
  const result = await PROGRAM_BOOK_COLLECTION.find({ 'objectives.targetType': 'bid' }).toArray();
  if (!isEmpty(result)) {
    throw new Error(`Some programBooks has bid as objective targetType : ${result.length}`);
  }
}

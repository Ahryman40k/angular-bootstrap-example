import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.66`;
const logger = createLogger(`mongo/${VERSION}`);

const REQUESTOR = 'REQUESTOR';
let PB_COLLECTION: Collection;

/**
 * For V2.7.66 we need to remove requestor from sharedRoles from programBooks
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  PB_COLLECTION = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);

  await updateProgramBooks();
  await assertResults();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateProgramBooks(): Promise<void> {
  const result = await PB_COLLECTION.updateMany({ sharedRoles: REQUESTOR }, { $pull: { sharedRoles: REQUESTOR } });
  logger.info(`End migration of programBooks ,  number of updated programBooks :   ${result.modifiedCount}`);
}

async function assertResults(): Promise<void> {
  const result = await PB_COLLECTION.find({ sharedRoles: REQUESTOR }).toArray();
  if (!isEmpty(result)) {
    throw new Error(`Some programBooks have ${REQUESTOR} as sharedRoles : ${result.length}`);
  }
}

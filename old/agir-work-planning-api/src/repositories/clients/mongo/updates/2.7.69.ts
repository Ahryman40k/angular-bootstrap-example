import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.69`;
const logger = createLogger(`mongo/${VERSION}`);

const REQUESTOR = 'REQUESTOR';
let ANNUAL_PROGRAM_COLLECTION: Collection;

/**
 * For V2.7.69 we need to remove requestor from sharedRoles from annualPrograms
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  ANNUAL_PROGRAM_COLLECTION = db.collection(constants.mongo.collectionNames.ANNUAL_PROGRAMS);

  await updateAnnualPrograms();
  await assertResults();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateAnnualPrograms(): Promise<void> {
  const result = await ANNUAL_PROGRAM_COLLECTION.updateMany(
    { sharedRoles: REQUESTOR },
    { $pull: { sharedRoles: REQUESTOR } }
  );
  logger.info(`End migration of annualPrograms ,  number of updated annualPrograms :   ${result.modifiedCount}`);
}

async function assertResults(): Promise<void> {
  const result = await ANNUAL_PROGRAM_COLLECTION.find({ sharedRoles: REQUESTOR }).toArray();
  if (!isEmpty(result)) {
    throw new Error(`Some annualPrograms have ${REQUESTOR} as sharedRoles : ${result.length}`);
  }
}

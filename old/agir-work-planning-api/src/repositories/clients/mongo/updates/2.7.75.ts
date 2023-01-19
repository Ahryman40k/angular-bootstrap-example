import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.75`;
const logger = createLogger(`mongo/${VERSION}`);

const COLLECTIONS: Collection[] = [];

/**
 * For V2.7.75 remove property attachments from intervention and project
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  COLLECTIONS.push(
    db.collection(constants.mongo.collectionNames.INTERVENTIONS),
    db.collection(constants.mongo.collectionNames.PROJECTS)
  );
  await updateCollections();
  await assertResults();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateCollections(): Promise<void> {
  for (const collection of COLLECTIONS) {
    const result = await collection.updateMany({ attachments: { $exists: true } }, { $unset: { attachments: '' } });
    logger.info(
      `End migration of properties attachements ,  number of updated ${collection.collectionName} : ${result.modifiedCount}`
    );
  }
}

async function assertResults(): Promise<void> {
  for (const collection of COLLECTIONS) {
    const result = await collection.find({ attachments: { $exists: true } }).toArray();
    if (!isEmpty(result)) {
      throw new Error(`Some ${collection.collectionName} have property attachments : ${result.length}`);
    }
  }
}

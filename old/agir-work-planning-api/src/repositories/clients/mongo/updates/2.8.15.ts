import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.8.15');
let PROJECTS_COLLECTION: Collection;

/**
 * For V2.8.15: Adjust projects with invalid statuses
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);

    await updateProjectStatuses();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.8.15 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function updateProjectStatuses(): Promise<void> {
  await PROJECTS_COLLECTION.updateMany(
    {
      status: 'created'
    },
    {
      $set: {
        status: 'planned'
      }
    }
  );

  await PROJECTS_COLLECTION.updateMany(
    {
      status: { $in: ['archived', 'inDesign', 'worked', 'inRealization'] }
    },
    {
      $set: {
        status: 'programmed'
      }
    }
  );
}

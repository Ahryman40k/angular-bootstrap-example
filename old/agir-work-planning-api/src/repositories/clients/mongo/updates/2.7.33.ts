import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.33');

/**
 * For V2.7.33 we remove bid number from projects
 */

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    await db.collection(constants.mongo.collectionNames.PROJECTS).updateMany(
      { 'annualDistribution.annualPeriods.bidNumber': { $exists: true } },
      {
        $unset: {
          'annualDistribution.annualPeriods.$.bidNumber': ''
        }
      }
    );
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.33 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

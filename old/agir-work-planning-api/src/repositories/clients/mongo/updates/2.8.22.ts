import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.8.22');
let SUBMISSIONS_COLLECTION: MongoDb.Collection;

/**
 * For V2.8.22 system allow update status from valid to invalid
 */

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();

    SUBMISSIONS_COLLECTION = db.collection(constants.mongo.collectionNames.SUBMISSIONS);

    await SUBMISSIONS_COLLECTION.find({ status: 'invalid' }).forEach(async submission => {
      await SUBMISSIONS_COLLECTION.updateOne(
        { _id: submission._id },
        {
          $set: {
            statusHistory: [
              {
                status: 'invalid',
                comment: submission.comment,
                createdAt: submission.audit.lastModifiedAt || submission.audit.createdAt,
                createdBy: {
                  userName: submission.audit.lastModifiedBy?.userName || submission.audit.createdBy?.userName,
                  displayName: submission.audit.lastModifiedBy?.displayName || submission.audit.createdBy?.displayName
                }
              }
            ]
          }
        }
      );
    });

    await SUBMISSIONS_COLLECTION.updateMany({}, { $unset: { comment: 1 } });

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.8.22 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

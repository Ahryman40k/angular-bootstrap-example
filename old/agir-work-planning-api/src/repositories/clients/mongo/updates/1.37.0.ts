import * as MongoDb from 'mongodb';
import * as mongoose from 'mongoose';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.37.0');

/**
 * For V1.37.0 we remove bidCount from programBook
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const programBookCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);

  const programBooks = await programBookCollection
    .find({
      bidCount: { $exists: true }
    })
    .toArray();
  if (!programBooks?.length) {
    logger.info(` > No program book have been found.`);
    return;
  }

  programBooks.every(async programBook => {
    const date = new Date();

    await programBookCollection.update(
      { _id: programBook._id },
      {
        $set: {
          objectives: [
            {
              assetTypeIds: null,
              workTypeIds: null,
              id: mongoose.Types.ObjectId().toHexString(),
              type: 'bid',
              name: 'Nombre de soumissions',
              values: {
                reference: programBook.bidCount,
                calculated: 0
              },
              requestorId: null,
              audit: {
                createdAt: date.toISOString(),
                createdBy: 'System'
              }
            }
          ]
        },
        $unset: {
          bidCount: ''
        }
      }
    );
  });
}

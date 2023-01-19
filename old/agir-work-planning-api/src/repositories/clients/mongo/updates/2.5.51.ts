import * as MongoDb from 'mongodb';
import { Types } from 'mongoose';
import { constants } from '../../../../../config/constants';
import { systemUser } from '../../../../services/auditService';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.5.51');

export default async function update(db: MongoDb.Db): Promise<void> {
  const bicImportLogsCollection = db.collection(constants.mongo.collectionNames.BIC_IMPORT_LOGS);
  await insertDefaultLastBicImport(bicImportLogsCollection);
}

// tslint:disable-next-line:max-func-body-length
async function insertDefaultLastBicImport(bicImportCollection: MongoDb.Collection): Promise<void> {
  try {
    await bicImportCollection.insert({
      _id: Types.ObjectId(),
      audit: {
        createdAt: '2020-11-25T22:00:00.000Z',
        createdBy: {
          userName: systemUser.userName,
          displayName: systemUser.displayName
        }
      }
    });
  } catch (e) {
    logger.error(`insertDefaultLastBicImport -> ${e}`);
  }
}

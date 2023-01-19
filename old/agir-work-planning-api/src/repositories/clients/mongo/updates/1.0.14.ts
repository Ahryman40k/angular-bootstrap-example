import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.0.14');

/**
 * For V1.0.14 we introduce the autoincremented IDs for interventions and projects
 * So we will need to delete all interventions, projects and auxiliary data.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  await Promise.all([
    deleteCollection(db, 'constraints'),
    deleteCollection(db, constants.mongo.collectionNames.HISTORY),
    deleteCollection(db, constants.mongo.collectionNames.INTERVENTIONS_HISTORICALS),
    deleteCollection(db, constants.mongo.collectionNames.INTERVENTIONS),
    deleteCollection(db, constants.mongo.collectionNames.PROJECTS)
  ]);
}

async function deleteCollection(db: MongoDb.Db, collectionName: string): Promise<void> {
  logger.info(` > Deleting all data from "${collectionName}" collection.`);
  await db.collection(collectionName).deleteMany({});
}

import * as MongoDb from 'mongodb';
import { constants } from '../../../../../../../config/constants';

/**
 * TEST update - version 1.0.0
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  await db.createCollection(constants.mongo.collectionNames.INTERVENTIONS);
}

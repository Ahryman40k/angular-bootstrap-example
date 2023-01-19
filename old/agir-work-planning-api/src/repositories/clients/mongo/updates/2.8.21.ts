import { isEmpty } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IInterventionAttributes } from '../../../../features/interventions/mongo/interventionAttributes';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.8.21');
let INTERVENTIONS_COLLECTION: MongoDb.Collection;

/**
 * For V2.8.21 to remove geometry from assets in no-geolocated Interventions
 */

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();

    INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
    const interventions = await getNonGeolocatedInterventions();
    await removeGeometryFromInterventions(interventions);

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.8.21 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}
async function getNonGeolocatedInterventions(): Promise<IInterventionAttributes[]> {
  return INTERVENTIONS_COLLECTION.find({
    $and: [
      { 'assets.id': null },
      {
        $or: [{ 'assets.externalReferenceIds': null }, { 'assets.externalReferenceIds': { $size: 0 } }]
      }
    ]
  }).toArray();
}
async function removeGeometryFromInterventions(interventions: IInterventionAttributes[]): Promise<void> {
  const interventionsIds = interventions.map(intervention => intervention._id);
  if (isEmpty(interventionsIds)) return;
  await INTERVENTIONS_COLLECTION.updateMany(
    { _id: { $in: interventionsIds } },
    { $unset: { 'assets.$[].geometry': 1 } }
  );
}

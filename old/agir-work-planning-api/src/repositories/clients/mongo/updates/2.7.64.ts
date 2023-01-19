import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.64`;
const logger = createLogger(`mongo/${VERSION}`);
const TRAFFIC_LIGHT = 'trafficLight';
let INTERVENTIONS_COLLECTION: Collection;

/**
 *   Correct asset  attribute assets.typeId  from value  trafficLights to  trafficLight
 *   in intervention
 *
 */

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  try {
    logger.info(`Migration ${VERSION}`);
    await migrateInterventions();
  } catch (e) {
    logger.error(e, `Migration ${VERSION} FAILED`);
    return;
  }
  const seconds = (Date.now() - startTime) / 1000;
  logger.info(`Migration ${VERSION} finished in ${seconds} seconds`);
}

async function migrateInterventions(): Promise<void> {
  logger.info('Start migration of interventions with asset.typeId = trafficLights to trafficLight');

  const result = await INTERVENTIONS_COLLECTION.updateMany(
    { 'assets.typeId': `${TRAFFIC_LIGHT}s` },
    { $set: { 'assets.$[elem].typeId': `${TRAFFIC_LIGHT}` } },
    { arrayFilters: [{ 'elem.typeId': `${TRAFFIC_LIGHT}s` }] }
  );

  logger.info(`End migration of interventions ,  number of updated interventions :   ${result.modifiedCount}`);
}

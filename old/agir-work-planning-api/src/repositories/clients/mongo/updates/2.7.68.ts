import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.68`;
const logger = createLogger(`mongo/${VERSION}`);

let INTERVENTION_COLLECTION: Collection;

/**
 * For V2.7.68 we need to remove externalIds without id from the interventions
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  INTERVENTION_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

  await updateInterventions();
  await assertResults();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateInterventions(): Promise<void> {
  const result = await INTERVENTION_COLLECTION.updateMany(
    { 'externalReferenceIds.type': { $ne: null }, 'externalReferenceIds.value': { $eq: null } },
    { $unset: { externalReferenceIds: '' } }
  );
  logger.info(`End migration of interventions ,  number of updated interventions :   ${result.modifiedCount}`);
}

async function assertResults(): Promise<void> {
  const result = await INTERVENTION_COLLECTION.find({
    'externalReferenceIds.type': { $ne: null },
    'externalReferenceIds.value': { $eq: null }
  }).toArray();
  if (!isEmpty(result)) {
    throw new Error(`Some interventions have externalReferenceIds without id : ${result.length}`);
  }
}

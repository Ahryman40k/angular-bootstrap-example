import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.72`;
const logger = createLogger(`mongo/${VERSION}`);

let TAXONOMIES_COLLECTION: Collection;

/**
 * For V2.7.72 we consolidate consultationOnly properties to boolean
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await updateTaxonomies();
  await assertResults();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateTaxonomies(): Promise<void> {
  let count = 0;
  const resultTrue = await TAXONOMIES_COLLECTION.updateMany(
    { group: TaxonomyGroup.assetType, 'properties.consultationOnly': 'true' },
    { $set: { 'properties.consultationOnly': true } }
  );
  count = resultTrue.modifiedCount;
  const resultFalse = await TAXONOMIES_COLLECTION.updateMany(
    { group: TaxonomyGroup.assetType, 'properties.consultationOnly': 'false' },
    { $set: { 'properties.consultationOnly': false } }
  );
  count += resultFalse.modifiedCount;
  logger.info(`End migration of properties consultationOnly ,  number of updated taxonomies :   ${count}`);
}

async function assertResults(): Promise<void> {
  const result = await TAXONOMIES_COLLECTION.find({
    group: TaxonomyGroup.assetType,
    $or: [{ 'properties.consultationOnly': 'true' }, { 'properties.consultationOnly': 'false' }]
  }).toArray();
  if (!isEmpty(result)) {
    throw new Error(`Some taxonomies have property consultationOnly as a string : ${result.length}`);
  }
}

import { InterventionDecisionType, ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.8.23');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.8.23 we need to add the taxonomy group/code returned/interventionDecisionType.
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertTaxonomies();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.8.23 executed in ${milliseconds} milliseconds`);
}

async function insertTaxonomies(): Promise<void> {
  logger.info('Start insert taxonomies');
  try {
    const interventionDecisionType: ITaxonomy = {
      group: 'interventionDecisionType',
      code: InterventionDecisionType.returned,
      label: {
        fr: 'Renvoyée',
        en: 'Returned'
      }
    };
    await TAXONOMIES_COLLECTION.insertOne(interventionDecisionType);
    logger.info(`nexoReferenceNumber inserted in collection ${TAXONOMIES_COLLECTION}`);
  } catch (e) {
    logger.error(`Error inserting interventionDecisionType ${InterventionDecisionType.returned} -> ${e}`);
  }
}

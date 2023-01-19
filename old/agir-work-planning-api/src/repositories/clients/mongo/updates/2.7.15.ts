import { InterventionStatus, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.15');
let TAXONOMIES_COLLECTION: Collection;

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertTaxonomies();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.15 executed in ${milliseconds} milliseconds`);
}

async function insertTaxonomies(): Promise<void> {
  try {
    await TAXONOMIES_COLLECTION.insertOne(interventionStatusWished);
    logger.info(`interventionStatusWished inserted in collection ${TAXONOMIES_COLLECTION}`);
  } catch (e) {
    logger.error(`Error inserting interventionStatusWished -> ${e}`);
  }
}

const interventionStatusWished: ITaxonomy = {
  group: TaxonomyGroup.interventionStatus,
  code: InterventionStatus.wished,
  label: {
    en: 'Wished',
    fr: 'Souhaitée'
  }
};

export const taxos2715: ITaxonomy[] = [interventionStatusWished];

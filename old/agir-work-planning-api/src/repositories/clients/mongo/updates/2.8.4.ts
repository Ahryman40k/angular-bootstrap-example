import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.4`;
const logger = createLogger(`mongo/${VERSION}`);
let taxonomiesCollection: MongoDb.Collection;

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  logger.info(`Insert in taxonomies collection`);
  const insertResults = await taxonomiesCollection.insertOne({
    code: 'conception',
    group: TaxonomyGroup.commentCategory,
    label: {
      fr: 'Conception',
      en: 'Conception'
    }
  });
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);

  logger.info(`Script ${VERSION} executed in ${Date.now() - startTime} milliseconds`);

  if (insertResults.insertedCount === 0) {
    throw new Error(`Error: Script ${VERSION}: 0 documents inserted instead of 1 document`);
  }
}

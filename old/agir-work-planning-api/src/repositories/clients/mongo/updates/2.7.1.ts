import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.1');

/**
 * For V2.7.1 we need to add the taxonomy group rtuImportStatus.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await createServiceTaxonomies(taxonomiesCollection);
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.1 executed in ${milliseconds} milliseconds`);
}

async function createServiceTaxonomies(collection: MongoDb.Collection): Promise<void> {
  logger.info('Create Service taxonomies');
  const taxonomies = getServiceTaxonomies();
  try {
    const insertResult = await collection.insertMany(taxonomies);
    logger.info(`${insertResult.insertedCount} documents inserted in collection ${collection.collectionName}`);
  } catch (e) {
    logger.error(`Create Service taxonomies error -> ${e}`);
  }
}

function getServiceTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'rtuImportStatus',
      code: 'successful',
      label: {
        en: 'Successful',
        fr: 'Réussi'
      }
    },
    {
      group: 'rtuImportStatus',
      code: 'failure',
      label: {
        en: 'Failure',
        fr: 'Échec'
      }
    }
  ];
}

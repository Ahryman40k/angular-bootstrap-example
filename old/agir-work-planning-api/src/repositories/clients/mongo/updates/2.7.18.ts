import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.18');

/**
 * For V2.7.18 we need to add the taxonomy group rtuImportStatus.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await createServiceTaxonomies(taxonomiesCollection);
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.18 executed in ${milliseconds} milliseconds`);
}

async function createServiceTaxonomies(collection: MongoDb.Collection): Promise<void> {
  logger.info('Create Service taxonomies');
  const taxonomies = getStatusTaxonomies();
  try {
    const insertResult = await collection.insertMany(taxonomies);
    logger.info(`${insertResult.insertedCount} documents inserted in collection ${collection.collectionName}`);
  } catch (e) {
    logger.error(`Create Service taxonomies error -> ${e}`);
  }
}
export const taxos2718: ITaxonomy[] = [...getStatusTaxonomies()];

function getStatusTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'exportStatus',
      code: 'inProgress',
      label: {
        en: 'In progress',
        fr: 'En cours'
      }
    },
    {
      group: 'exportStatus',
      code: 'successful',
      label: {
        en: 'Successful',
        fr: 'Succès'
      }
    },
    {
      group: 'exportStatus',
      code: 'failure',
      label: {
        en: 'Failure',
        fr: 'Échec'
      }
    }
  ];
}

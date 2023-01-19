import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.6.2');

/**
 * For V2.6.2 we need to add the taxonomy group Service.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deleteServiceTaxonomies(taxonomiesCollection);
  await createServiceTaxonomies(taxonomiesCollection);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.6.2 executed in ${milliseconds} milliseconds`);
}

async function deleteServiceTaxonomies(collection: MongoDb.Collection): Promise<void> {
  logger.info('Delete Service taxonomies');
  try {
    const result = await collection.deleteMany({ group: 'service' });
    logger.info(`${result.deletedCount} group Service deleted`);
  } catch (e) {
    logger.error(`Delete Service taxonomies error -> ${e}`);
  }
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
      group: 'service',
      code: 'sum',
      label: {
        fr: "Service de l'urbanisme et de la mobilité",
        en: "Service de l'urbanisme et de la mobilité"
      },
      properties: {
        requestors: [
          'gpdm',
          'publicWorksPT',
          'signals',
          'gpdu',
          'gpville',
          'waterManagement',
          'publicWorksRoad',
          'dtac',
          'borough',
          'sgp',
          'sgpi',
          'senv',
          'dagp',
          'gppart',
          'sca'
        ]
      }
    },
    {
      group: 'service',
      code: 'se',
      label: {
        fr: "Service de l'eau",
        en: "Service de l'eau"
      },
      properties: {
        requestors: ['dep', 'deeu', 'dre']
      }
    }
  ];
}

import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.2');

/**
 * For V2.7.2 we need to add the acronyms to each project service
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await updateTaxonomiesCollection(taxonomiesCollection);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.2 executed in ${milliseconds} milliseconds`);
}

async function updateTaxonomiesCollection(collection: MongoDb.Collection): Promise<void> {
  try {
    await collection.updateOne(
      { group: 'service', code: 'sum' },
      {
        $set: {
          'properties.acronym.fr': 'SUM',
          'properties.acronym.en': 'SUM'
        }
      }
    );

    await collection.updateOne(
      { group: 'service', code: 'se' },
      {
        $set: {
          'properties.acronym.fr': 'SE',
          'properties.acronym.en': 'SE'
        }
      }
    );
  } catch (e) {
    logger.error(`Error -> ${e}`);
  }
}

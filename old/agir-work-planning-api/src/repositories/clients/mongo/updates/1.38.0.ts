import * as MongoDb from 'mongodb';

import { configs } from '../../../../../config/configs';
import { constants } from '../../../../../config/constants';
import { taxonomyRepository } from '../../../../features/taxonomies/mongo/taxonomyRepository';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.38.0');

/**
 * For V1.38.0 we need to make assets consistent with the other systems.
 * So we need to migrate all of our data to the new schema.
 * From now on, any changes made to the taxonomies must be done in a migration script.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomyCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  const taxonomies = taxonomyRepository.mapTaxonomies(
    require(`${configs.root}/src/repositories/clients/mongo/data/taxonomies.latest.json`)
  );

  logger.debug('Truncate the taxonomy collection.');
  await taxonomyCollection.deleteMany({});

  logger.debug('Inserting the full taxonomy collection.');
  await taxonomyCollection.insertMany(taxonomies);
}

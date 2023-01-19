import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as mongodb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.46.0');
let taxonomiesCollection: mongodb.Collection<ITaxonomy> = null;
/**
 * For V1.46.0 We need to add "borough" to the list of owners of the asset type "roadway".
 */
export default async function update(db: mongodb.Db): Promise<void> {
  const group = TaxonomyGroup.assetType;
  const code = 'roadway';
  const ownerToAdd = 'borough';

  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  const filter = { group, code };
  const taxonomy = await taxonomiesCollection.findOne(filter);

  if (taxonomy.properties.owners?.includes(ownerToAdd)) {
    logger.info('Did not add borough because it already exists.');
    return;
  }

  logger.info('Adding borough to the list of owners of the asset type roadway.');
  await taxonomiesCollection.updateOne(filter, { $push: { 'properties.owners': ownerToAdd } });
  logger.info('Added borough to the list of owners of the asset type roadway.');
}

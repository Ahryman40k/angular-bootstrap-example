import { ITaxonomy, MedalType, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as mongodb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.47.0');
let taxonomiesCollection: mongodb.Collection<ITaxonomy> = null;

/**
 * For V1.47.0 We need to update the medal taxonomies to set a display order.
 */
export default async function update(db: mongodb.Db): Promise<void> {
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const taxonomies = await taxonomiesCollection.find({ group: TaxonomyGroup.medalType }).toArray();
  taxonomies.find(x => x.code === MedalType.bronze).displayOrder = 1;
  taxonomies.find(x => x.code === MedalType.silver).displayOrder = 2;
  taxonomies.find(x => x.code === MedalType.gold).displayOrder = 3;
  taxonomies.find(x => x.code === MedalType.platinum).displayOrder = 4;

  logger.info('Updating medal taxonomies.');
  for (const taxonomy of taxonomies) {
    await taxonomiesCollection.updateOne(
      { group: taxonomy.group, code: taxonomy.code },
      { $set: { displayOrder: taxonomy.displayOrder } }
    );
  }
  logger.info('Done updating medal taxonomies.');
}

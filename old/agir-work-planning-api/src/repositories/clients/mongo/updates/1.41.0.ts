import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.41.0');
/**
 * For V1.41.0 we need to add constraint-description taxonomy to group commentCategory
 */

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  const taxonomyCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const taxonomy: ITaxonomy = {
    group: 'commentCategory',
    code: 'constraint-description',
    label: {
      fr: `Description d'une contrainte`,
      en: 'Constraint description'
    }
  };

  try {
    await taxonomyCollection.insertOne(taxonomy);
  } catch (e) {
    logger.error(e, `Adding constraint-description to group commentCategory failed.`);
    return;
  }

  const endTime = Date.now();
  const seconds = (endTime - startTime) / 1000;

  logger.info(`Migration finished in ${seconds} seconds`);
}

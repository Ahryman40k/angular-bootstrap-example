import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.42.0');
/**
 * For V1.41.0 we need to add constraint-description taxonomy to group commentCategory
 */

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  const taxonomyCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const taxonomy: ITaxonomy = {
    group: 'configuration',
    code: 'filter-config',
    label: { fr: '', en: '' },
    properties: {
      interventionStatuses: [
        'created',
        'received',
        'planned',
        'integrated',
        'regrouped',
        'finalOrdered',
        'preliminaryOrdered',
        'postponed',
        'canceled',
        'refused',
        'waiting'
      ],
      projectStatuses: [
        'created',
        'planned',
        'programmed',
        'finalOrdered',
        'preliminaryOrdered',
        'postponed',
        'replanned',
        'canceled'
      ]
    }
  };

  try {
    await taxonomyCollection.insertOne(taxonomy);
  } catch (e) {
    logger.error(e, `Creating group configuration and code filter-config failed.`);
    return;
  }

  const endTime = Date.now();
  const seconds = (endTime - startTime) / 1000;

  logger.info(`Migration finished in ${seconds} seconds`);
}

import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.41');
let TAXONOMIES_COLLECTION: Collection;

/**
 * For V2.7.41 update project status
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

    await TAXONOMIES_COLLECTION.updateMany(
      {
        group: TaxonomyGroup.projectStatus,
        code: { $in: ['replanned', 'preliminaryOrdered', 'planned', 'postponed', 'programmed'] }
      },
      {
        $set: {
          'properties.rtuData.status': 'P'
        }
      }
    );

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.41 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

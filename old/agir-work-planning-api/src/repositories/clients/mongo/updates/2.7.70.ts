import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.70`;
const logger = createLogger(`mongo/${VERSION}`);

let TAXONOMY_COLLECTION: Collection;

/**
 * For V2.7.70 we need to change worktype labels
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  TAXONOMY_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await updateTaxonomyGroup();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateTaxonomyGroup(): Promise<void> {
  const result = await TAXONOMY_COLLECTION.updateOne(
    {
      code: 'workType',
      group: 'taxonomyGroup'
    },
    {
      $set: {
        'label.fr': 'Nature des travaux',
        'description.fr': 'Ce groupe définit les natures de travaux disponibles.'
      }
    }
  );
  logger.info(`End migration of taxonomies ,  number of updated taxonomies :   ${result.modifiedCount}`);
}

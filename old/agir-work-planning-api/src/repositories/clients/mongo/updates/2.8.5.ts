import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.5`;
const logger = createLogger(`mongo/${VERSION}`);
let taxonomiesCollection: MongoDb.Collection;

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  logger.info(`Set property permission from submissionProgressStatus in taxonomyGroup to ModificationOnly `);
  const result = await taxonomiesCollection.updateOne(
    {
      code: 'submissionProgressStatus',
      group: TaxonomyGroup.taxonomyGroup
    },
    {
      $set: {
        'properties.permission': 'ModificationOnly'
      }
    }
  );

  if (result.modifiedCount === 0) {
    throw new Error(`Error: Script ${VERSION}: 0 taxonomy updated`);
  }
  logger.info(`updated taxonomy: ${result.modifiedCount}`);
  logger.info(`Script ${VERSION} executed in ${Date.now() - startTime} milliseconds`);
}

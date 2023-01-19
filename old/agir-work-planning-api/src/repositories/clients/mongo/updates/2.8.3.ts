import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.3`;
const logger = createLogger(`mongo/${VERSION}`);
let taxonomiesCollection: MongoDb.Collection;

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  logger.info(`Insert in taxonomies collection`);
  const insertResults = await taxonomiesCollection.insertOne({
    code: 'externalReferenceType',
    group: TaxonomyGroup.taxonomyGroup,
    label: {
      fr: 'Type de référence externe',
      en: 'External reference type'
    },
    description: {
      fr: 'Ce groupe définit les types de référence externe.',
      en: 'This group defines the external reference types.'
    },
    properties: {
      category: 'project',
      permission: 'ModificationOnly'
    }
  });
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);

  logger.info(`Script ${VERSION} executed in ${Date.now() - startTime} milliseconds`);
}

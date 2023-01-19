import * as MongoDb from 'mongodb';

import { CommentCategory, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.43.3');

/**
 * For V1.43.3 We need to add a taxonomy for the comment type risk.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertNetworkTypeTaxonomies(taxonomiesCollection);
}

async function insertNetworkTypeTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy for comment type other`);
  const taxonomies = [
    {
      group: TaxonomyGroup.commentCategory,
      code: CommentCategory.other,
      label: {
        fr: 'Autre',
        en: 'Other'
      }
    }
  ];
  for (const taxonomy of taxonomies) {
    try {
      await taxonomiesCollection.insertOne(taxonomy);
    } catch (e) {
      logger.error(e, `Creating group ${TaxonomyGroup.commentCategory} and code ${taxonomy.code} failed.`);
      return;
    }
  }
}

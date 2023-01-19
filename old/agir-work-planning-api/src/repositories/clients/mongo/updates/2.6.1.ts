import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.6.1');

/**
 * For V2.6.1 we need to delete the opportunity planning decision pending taxonomy.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deleteOpportunityPlanningDecisionPendingTaxonomy(taxonomiesCollection);
}

async function deleteOpportunityPlanningDecisionPendingTaxonomy(
  taxonomiesCollection: MongoDb.Collection
): Promise<void> {
  logger.info('Delete opportunity planning decision pending taxonomy');
  try {
    await taxonomiesCollection.deleteOne({
      group: 'opportunityPlaningDecision',
      code: 'pending'
    });
  } catch (e) {
    logger.info(`Delete opportunity planning decision pending taxonomy error -> ${e}`);
  }
}

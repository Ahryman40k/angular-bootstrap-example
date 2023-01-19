import { uniq } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.4.10');
/**
 * Add boolean to project for the property isOpportunityNotice
 * @param db
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = new Date().getTime();
  const projectCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
  const opportunityNoticesCollection = db.collection(constants.mongo.collectionNames.OPPORTUNITY_NOTICES);
  const resultNinProjectIds = await getNinProjectIds(opportunityNoticesCollection);
  const ninProjectIds = uniq(resultNinProjectIds.map(obj => obj.projectId)) || [];
  await addIsOpportunityAnalysis(projectCollection, ninProjectIds);
  const milliseconds = new Date().getTime() - startTime;
  logger.info(`Script 2.4.10 executed in ${milliseconds} milliseconds`);
}

async function addIsOpportunityAnalysis(projectCollection: MongoDb.Collection, ninProjectIds: string[]): Promise<void> {
  await projectCollection.updateMany({ _id: { $nin: ninProjectIds } }, { $set: { isOpportunityAnalysis: false } });
  await projectCollection.updateMany({ _id: { $in: ninProjectIds } }, { $set: { isOpportunityAnalysis: true } });
}

async function getNinProjectIds(opportunityNoticesCollection: MongoDb.Collection): Promise<{ projectId: string }[]> {
  return opportunityNoticesCollection
    .aggregate([
      {
        $project: { projectId: 1, _id: 0 }
      }
    ])
    .toArray();
}

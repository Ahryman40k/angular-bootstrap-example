import { chunk } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IProjectAttributes } from '../../../../features/projects/mongo/projectModel';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.34');

/**
 * For V2.7.34 we need to update the project's drm number fields from empty string to null
 */

let projectCollection: MongoDb.Collection;

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    projectCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
    const projects = await findProjects();
    await updateProjects(projects);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.34 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function findProjects(): Promise<IProjectAttributes[]> {
  return projectCollection
    .find({
      drmNumber: { $exists: true }
    })
    .toArray();
}

async function updateProjects(projects: IProjectAttributes[]): Promise<void> {
  const updatedProjectPromises = projects.map(async p => {
    p.drmNumber = p.drmNumber ? p.drmNumber.toString() : null;
    return projectCollection.findOneAndReplace({ _id: p._id }, p);
  });
  for (const chunkedPromises of chunk(updatedProjectPromises, 10)) {
    try {
      await Promise.all(chunkedPromises);
    } catch (e) {
      logger.error(`Update projects error -> ${e}`);
    }
  }
}

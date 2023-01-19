import { IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.35.0');

/**
 * For V1.35.0 we are implementing APOC-3191 which consists of updating the projects' names
 * to append the street name on them. For example, if the name of a project is "Foo" and the
 * related street name is "Bar", the project name will be updated to "Foo - Bar".
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const projectsCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
  const projects = (await projectsCollection.find().toArray()) as IEnrichedProject[];
  if (!projects?.length) {
    logger.info(` > No projects have been found.`);
    return;
  }
  logger.info(` > Updating ${projects.length} projects.`);
  for (const project of projects) {
    if (!project.streetName || project.projectName.indexOf(project.streetName) > 0) {
      continue;
    }
    const projectName = `${project.projectName} - ${project.streetName}`;
    // tslint:disable-next-line: no-string-literal
    await projectsCollection.update({ _id: project['_id'] }, { $set: { projectName } });
  }
  logger.info(` > Finished updating projects.`);
}

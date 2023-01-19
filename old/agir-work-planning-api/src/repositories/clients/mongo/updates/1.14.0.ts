import * as turf from '@turf/turf';
import { IEnrichedIntervention, IEnrichedProject, IPoint3D } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { workAreaService } from '../../../../services/workAreaService';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.14.0');

/**
 * For V1.13.0 we introduce the geometry pins for interventions and projects
 * So we will need to update all interventions and projects to add this new property.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  await updateInterventions(db);
  await updateProjects(db);
}

async function updateInterventions(db: MongoDb.Db): Promise<void> {
  logger.info(` > Updating all interventions for geometry pin.`);
  const interventionsCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  const interventions = (await interventionsCollection.find().toArray()) as IEnrichedIntervention[];
  if (!interventions?.length) {
    logger.info(` > No intervention has been found.`);
    return;
  }
  logger.info(` > Updating ${interventions.length} interventions.`);
  for (const intervention of interventions) {
    intervention.interventionArea.geometry = workAreaService.simplifyWorkArea(intervention.interventionArea.geometry);
    if (!intervention.interventionArea.geometryPin) {
      intervention.interventionArea.geometryPin = generatePin(intervention.interventionArea.geometry);
    }
  }
  logger.info(` > Inserting the interventions.`);
  await interventionsCollection.deleteMany({});
  await interventionsCollection.insertMany(interventions);
}

async function updateProjects(db: MongoDb.Db): Promise<void> {
  logger.info(` > Updating all projects for geometry pin.`);
  const projectsCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
  const projects = (await projectsCollection.find().toArray()) as IEnrichedProject[];
  if (!projects?.length) {
    logger.info(` > No project has been found.`);
    return;
  }
  logger.info(` > Updating ${projects.length} projects.`);
  for (const project of projects) {
    project.geometry = workAreaService.simplifyWorkArea(project.geometry);
    if (project.geometry && !project.geometryPin) {
      project.geometryPin = generatePin(project.geometry);
    }
  }
  logger.info(` > Inserting the projects.`);
  await projectsCollection.deleteMany({});
  await projectsCollection.insertMany(projects);
}

function generatePin(geometry: turf.AllGeoJSON): IPoint3D {
  return turf.pointOnFeature(geometry).geometry.coordinates;
}

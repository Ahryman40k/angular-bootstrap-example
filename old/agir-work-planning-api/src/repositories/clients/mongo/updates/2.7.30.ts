import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { chunk } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IInterventionAttributes } from '../../../../features/interventions/mongo/interventionAttributes';
import { IProjectAttributes } from '../../../../features/projects/mongo/projectModel';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.30');

/**
 * For V2.7.30 we need to update the taxonomy code "arterial/local" to "arterialLocal" to prevent route bugs (ex: GET taxonomy/arterial/local)
 */

const ARTERIAL_LOCAL_NEW_CODE = 'arterialLocal';
let PROJECTS_COLLECTION: MongoDb.Collection;
let INTERVENTIONS_COLLECTION: MongoDb.Collection;

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    await updateTaxonomy(db);
    await updateProjects(db);
    await updateInterventions(db);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.30 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function updateTaxonomy(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await taxonomiesCollection.updateOne(
    { group: 'roadNetworkType', code: 'arterial/local' },
    {
      $set: {
        code: ARTERIAL_LOCAL_NEW_CODE
      }
    }
  );
}

async function updateProjects(db: MongoDb.Db): Promise<void> {
  PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);
  const projectsToUpdate = await PROJECTS_COLLECTION.find({ roadNetworkTypeId: 'arterial/local' }).toArray();

  const promises = getUpdateProjectPromises(projectsToUpdate);
  for (const chunkedPromises of chunk(promises, 10)) {
    try {
      await Promise.all(chunkedPromises);
    } catch (e) {
      logger.error(`Update projects error -> ${e}`);
    }
  }
}

async function updateInterventions(db: MongoDb.Db): Promise<void> {
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  const interventionsToUpdate = await INTERVENTIONS_COLLECTION.find({ roadNetworkTypeId: 'arterial/local' }).toArray();

  const promises = getUpdateInterventionPromises(interventionsToUpdate);
  for (const chunkedPromises of chunk(promises, 10)) {
    try {
      await Promise.all(chunkedPromises);
    } catch (e) {
      logger.error(`Update intervention error -> ${e}`);
    }
  }
}

function getUpdateProjectPromises(projects: IProjectAttributes[]): Promise<void>[] {
  return projects.map(async p => {
    updateRoadNetworkTypeId(p);
    return updateProject(p);
  });
}

function getUpdateInterventionPromises(interventions: IInterventionAttributes[]): Promise<void>[] {
  return interventions.map(async i => {
    updateRoadNetworkTypeId(i);
    return updateIntervention(i);
  });
}

function updateRoadNetworkTypeId(object: IProjectAttributes | IInterventionAttributes): void {
  object.roadNetworkTypeId = ARTERIAL_LOCAL_NEW_CODE;
}

async function updateProject(project: IProjectAttributes): Promise<void> {
  await PROJECTS_COLLECTION.updateOne(
    {
      _id: project._id
    },
    {
      $set: {
        roadNetworkTypeId: ARTERIAL_LOCAL_NEW_CODE
      }
    },
    { upsert: true }
  );
}

async function updateIntervention(intervention: IInterventionAttributes): Promise<void> {
  await INTERVENTIONS_COLLECTION.updateOne(
    {
      _id: intervention._id
    },
    {
      $set: {
        roadNetworkTypeId: ARTERIAL_LOCAL_NEW_CODE
      }
    },
    { upsert: true }
  );
}

export const taxos2730: ITaxonomy[] = getRoadNetworkTypeTaxonomies();

// tslint:disable-next-line: max-func-body-length
function getRoadNetworkTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'roadNetworkType',
      code: ARTERIAL_LOCAL_NEW_CODE,
      label: {
        fr: 'Artériel/Local',
        en: 'Arterial/Local'
      },
      displayOrder: 2
    }
  ];
}

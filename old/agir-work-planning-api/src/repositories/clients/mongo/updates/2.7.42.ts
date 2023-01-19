import {
  IEnrichedIntervention,
  InterventionStatus,
  ITaxonomy,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.42');

/**
 * For V2.7.42 we need to update intervention statuses
 */

let taxonomiesCollection: MongoDb.Collection;
let interventionsCollection: MongoDb.Collection;

// Not using enum because these values will be deleted from it
const interventionStatusToDelete = [
  'received',
  'archived',
  'preliminaryOrdered',
  'inDesign',
  'created',
  'postponed',
  'finalOrdered',
  'worked',
  'inRealization',
  'regrouped',
  'planned',
  'replanned'
];

export const taxos2742 = [getInterventionStatusTaxonomy()];

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();

    taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
    interventionsCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

    await deleteInterventionStatusTaxonomies();
    await addInterventionStatusTaxonomy();
    await updateInterventions();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.42 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}
async function deleteInterventionStatusTaxonomies(): Promise<void> {
  await taxonomiesCollection.deleteMany({
    group: TaxonomyGroup.interventionStatus,
    code: { $in: interventionStatusToDelete }
  });
}

async function addInterventionStatusTaxonomy(): Promise<void> {
  await taxonomiesCollection.insertOne(getInterventionStatusTaxonomy());
}

function getInterventionStatusTaxonomy(): ITaxonomy {
  return {
    group: 'interventionStatus',
    code: 'accepted',
    label: {
      fr: 'Acceptée',
      en: 'Accepted'
    }
  };
}

async function updateInterventions(): Promise<void> {
  const interventions = (await interventionsCollection
    .find({ status: { $in: interventionStatusToDelete } })
    .toArray()) as IEnrichedIntervention[];
  interventions.forEach(intervention => {
    if (intervention.project) {
      const projectType = intervention.project.typeId;
      if (projectType === ProjectType.integrated || projectType === ProjectType.integratedgp) {
        intervention.status = InterventionStatus.integrated;
      } else if (projectType === ProjectType.nonIntegrated) {
        intervention.status = InterventionStatus.accepted;
      }
    } else {
      if (intervention.programId) {
        if (intervention.decisionRequired) {
          intervention.status = InterventionStatus.waiting;
        } else {
          intervention.status = InterventionStatus.accepted;
        }
      } else {
        intervention.status = InterventionStatus.waiting;
      }
    }
  });
}

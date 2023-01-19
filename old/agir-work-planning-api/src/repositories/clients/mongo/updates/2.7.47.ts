import { chunk } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

// Need the enum to be standalone
enum InterventionStatus {
  accepted = 'accepted',
  integrated = 'integrated',
  waiting = 'waiting'
}

// Need the enum to be standalone
enum ProjectType {
  integrated = 'integrated',
  integratedgp = 'integratedgp'
}

const logger = createLogger('mongo/2.7.47');

/**
 * For V2.7.47 we need to update intervention statuses
 */

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

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();

    interventionsCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
    await updateInterventions();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.47 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function updateInterventions(): Promise<void> {
  const interventions = await interventionsCollection.find({ status: { $in: interventionStatusToDelete } }).toArray();
  const promises = interventions.map(intervention => {
    let status = InterventionStatus.accepted;
    if (intervention.project) {
      const projectType = intervention.project.typeId;
      if (projectType === ProjectType.integrated || projectType === ProjectType.integratedgp) {
        status = InterventionStatus.integrated;
      }
    } else {
      if (intervention.programId) {
        if (intervention.decisionRequired) {
          status = InterventionStatus.waiting;
        }
      } else {
        status = InterventionStatus.waiting;
      }
    }
    return interventionsCollection.updateOne(
      { _id: intervention._id },
      {
        $set: {
          status
        }
      }
    );
  });
  for (const chunkedPromises of chunk(promises, 10)) {
    await Promise.all(chunkedPromises);
  }
}

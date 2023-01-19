import { InterventionStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, isNil, remove } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IInterventionAttributes } from '../../../../features/interventions/mongo/interventionAttributes';
import { enumValues } from '../../../../utils/enumUtils';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.67`;
const logger = createLogger(`mongo/${VERSION}`);

let INTERVENTIONS_COLLECTION: Collection;

enum InterventionFiltered {
  interventionsWaiting,
  interventionsAccepted,
  interventionsIntegrated
}

/**
 * For V2.7.67 we need to remove regrouped status from projects
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();

  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

  const interventions = await getInvalidInterventions();
  const filteredInterventions = filterInterventions(interventions);

  await updateInterventions(filteredInterventions);

  const milliseconds = Date.now() - startTime;

  logger.info(`Script 2.7.67 executed in ${milliseconds} milliseconds`);
}

async function getInvalidInterventions(): Promise<IInterventionAttributes[]> {
  const validStatuses: string[] = enumValues(InterventionStatus);
  return INTERVENTIONS_COLLECTION.find({
    status: { $nin: validStatuses }
  }).toArray();
}

function filterInterventions(interventions: any[]): any[][] {
  const filteredInterventions = [];
  filteredInterventions[InterventionFiltered.interventionsWaiting] = remove(
    interventions,
    i => isNil(i.project?.id) || i.project?.id === ''
  );
  filteredInterventions[InterventionFiltered.interventionsAccepted] = remove(
    interventions,
    i => !isNil(i.project?.id) && i.project?.typeId === 'nonIntegrated'
  );
  filteredInterventions[InterventionFiltered.interventionsIntegrated] = interventions;
  return filteredInterventions;
}

async function updateInterventions(filteredInterventions: IInterventionAttributes[][]): Promise<void> {
  for (const index of Object.keys(InterventionFiltered).filter(key => isNaN(Number(InterventionFiltered[key])))) {
    const interventionIds = filteredInterventions[+index]?.map((i: IInterventionAttributes) => i._id);
    if (isEmpty(interventionIds)) continue;
    const status = getStatus(+index);
    const result = await INTERVENTIONS_COLLECTION.updateMany({ _id: { $in: interventionIds } }, { $set: { status } });
    logger.info(`${result.modifiedCount} interventions changed their status to ${status}`);
  }
}

function getStatus(index: number): string {
  switch (index) {
    case InterventionFiltered.interventionsWaiting:
      return InterventionStatus.waiting;
    case InterventionFiltered.interventionsAccepted:
      return InterventionStatus.accepted;
    default:
      return InterventionStatus.integrated;
  }
}

import { InterventionDecisionType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.65`;
const logger = createLogger(`mongo/${VERSION}`);

let INTERVENTIONS_COLLECTION: Collection;
let TAXONOMIES_COLLECTION: Collection;

/**
 * For V2.7.65 we need to remove constraints attribute of interventions and projects
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

  try {
    try {
      await TAXONOMIES_COLLECTION.deleteMany({
        group: 'interventionDecisionType',
        code: { $in: ['planned', 'acceptedRequirement'] }
      });
      logger.info(`interventionDecisionType planned and interventionDecisionType types removed from taxonomy`);
    } catch (e) {
      logger.error(
        `Error removing interventionDecisionType planned and interventionDecisionType types from taxonomy -> ${e}`
      );
    }

    await updateInteventionAcceptedRequirementDecision();
    await removeInteventionPlannedDecision();
  } catch (e) {
    logger.error(e, `Migration ${VERSION} FAILED`);
    return;
  }

  logger.info(`Script 2.7.65 executed in ${milliseconds} milliseconds`);
}

async function updateInteventionAcceptedRequirementDecision(): Promise<void> {
  const result = await INTERVENTIONS_COLLECTION.updateMany(
    { 'decisions.typeId': InterventionDecisionType.acceptedRequirement },
    { $set: { 'decisions.$[elem].typeId': InterventionDecisionType.accepted } },
    { arrayFilters: [{ 'elem.typeId': InterventionDecisionType.acceptedRequirement }] }
  );
  logger.info(`End migration of interventions ,  number of updated interventions :   ${result.modifiedCount}`);
}

async function removeInteventionPlannedDecision(): Promise<void> {
  const result = await INTERVENTIONS_COLLECTION.updateMany(
    { 'decisions.typeId': InterventionDecisionType.planned },
    { $pull: { decisions: { typeId: InterventionDecisionType.planned } } }
  );
  logger.info(`End migration of interventions ,  number of updated interventions :   ${result.modifiedCount}`);
}

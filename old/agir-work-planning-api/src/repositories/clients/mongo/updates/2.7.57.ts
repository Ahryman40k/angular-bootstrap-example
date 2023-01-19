import { IRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { isEmpty } from 'lodash';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.57');
let TAXONOMIES_COLLECTION: Collection;
let INTERVENTIONS_COLLECTION: Collection;
let REQUIREMENTS_COLLECTION: Collection;
/**
 * For V2.7.57 we need to remove references to the old intervention requirements feature from the taxonomy
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  REQUIREMENTS_COLLECTION = db.collection(constants.mongo.collectionNames.REQUIREMENTS);
  await migrateOldRequirementsToRequirementsCollection();
  await removeInterventionRequirementTypeGroup();
  await removeInterventionRequirementTypeTaxonomyGroup();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.57 executed in ${milliseconds} milliseconds`);
}

async function removeInterventionRequirementTypeGroup(): Promise<void> {
  logger.info('Start removing interventionRequirementType group from taxonomy');
  try {
    await TAXONOMIES_COLLECTION.deleteMany({ group: 'interventionRequirementType' });
    logger.info(`interventionRequirementType group removed from taxonomy`);
  } catch (e) {
    logger.error(`Error removing interventionRequirementType group from taxonomy -> ${e}`);
  }
}

async function removeInterventionRequirementTypeTaxonomyGroup(): Promise<void> {
  logger.info('Start removing interventionRequirementType taxonomy group from taxonomy');
  try {
    await TAXONOMIES_COLLECTION.deleteOne({ group: 'taxonomyGroup', code: 'interventionRequirementType' });
    logger.info(`interventionRequirementType taxonomy group removed from taxonomy`);
  } catch (e) {
    logger.error(`Error removing interventionRequirementType taxonomy group from taxonomy -> ${e}`);
  }
}

async function migrateOldRequirementsToRequirementsCollection(): Promise<void> {
  logger.info('Start migration of intervention requirements to collection requirements');
  try {
    const newRequirements: Partial<IRequirement>[] = [];
    const interventions = await INTERVENTIONS_COLLECTION.find({
      requirements: { $exists: true, $not: { $size: 0 } }
    }).toArray();
    const subtypes = await TAXONOMIES_COLLECTION.find({ group: 'requirementSubtype' }).toArray();
    for (const intervention of interventions) {
      for (const requirement of intervention.requirements) {
        let subType = '';
        let type = requirement.typeId;
        switch (requirement.typeId) {
          case 'other':
            subType = 'otherRequirements';
            break;
          case 'work':
            subType = 'espBeforePcpr';
            break;
          case 'programmation':
            subType = 'coordinationWork';
            break;
          default:
            const subTypeTaxo = subtypes.find(item => item.code === requirement.typeId);
            type = subTypeTaxo.properties.requirementType;
            subType = requirement.typeId;
        }

        newRequirements.push({
          typeId: type,
          text: requirement.text,
          subtypeId: subType,
          items: [
            {
              id: intervention._id,
              type: 'intervention'
            }
          ],
          audit: requirement.audit
        });
      }
    }
    if (!isEmpty(newRequirements)) {
      const results = await REQUIREMENTS_COLLECTION.insertMany(newRequirements);
      logger.info(`${results.insertedCount} documents inserted in requirements collection`);
    }
    // Remove attribute requirements of interventions only if migrations is successsfull
    await removeAttributeFromInterventionCollection();
  } catch (e) {
    logger.error(`Error migrating intervention requirements to collection requirements -> ${e}`);
  }
}

async function removeAttributeFromInterventionCollection(): Promise<void> {
  logger.info('Start removing requirements attribute from collection interventions');
  try {
    await INTERVENTIONS_COLLECTION.updateMany({}, { $unset: { requirements: 1 } });
    logger.info(`Requirements attribute removed from collection interventions`);
  } catch (e) {
    logger.error(`Error removing requirements attribute from collection interventions -> ${e}`);
  }
}

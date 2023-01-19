import { IRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.62');
let TAXONOMIES_COLLECTION: Collection;
let PROJECTS_COLLECTION: Collection;
let REQUIREMENTS_COLLECTION: Collection;
/**
 * For V2.7.62 we need to remove references to the old project requirements feature from the taxonomy
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);
  REQUIREMENTS_COLLECTION = db.collection(constants.mongo.collectionNames.REQUIREMENTS);
  await migrateOldRequirementsToRequirementsCollection();
  await removeProjectRequirementTypeGroup();
  await removeProjectRequirementTypeTaxonomyGroup();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.62 executed in ${milliseconds} milliseconds`);
}

async function removeProjectRequirementTypeGroup(): Promise<void> {
  logger.info('Start removing projectRequirementType group from taxonomy');
  try {
    await TAXONOMIES_COLLECTION.deleteMany({ group: 'projectRequirementType' });
    logger.info(`projectRequirementType group removed from taxonomy`);
  } catch (e) {
    logger.error(`Error removing projectRequirementType group from taxonomy -> ${e}`);
  }
}

async function removeProjectRequirementTypeTaxonomyGroup(): Promise<void> {
  logger.info('Start removing projectRequirementType taxonomy group from taxonomy');
  try {
    await TAXONOMIES_COLLECTION.deleteOne({ group: 'taxonomyGroup', code: 'projectRequirementType' });
    logger.info(`projectRequirementType taxonomy group removed from taxonomy`);
  } catch (e) {
    logger.error(`Error removing projectRequirementType taxonomy group from taxonomy -> ${e}`);
  }
}

async function migrateOldRequirementsToRequirementsCollection(): Promise<void> {
  logger.info('Start migration of project requirements to collection requirements');
  try {
    const newRequirements: Partial<IRequirement>[] = [];
    const projects = await PROJECTS_COLLECTION.find({
      requirements: { $exists: true, $not: { $size: 0 } }
    }).toArray();
    const subtypes = await TAXONOMIES_COLLECTION.find({ group: 'requirementSubtype' }).toArray();
    for (const project of projects) {
      for (const requirement of project.requirements) {
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
              id: project._id,
              type: 'project'
            }
          ],
          audit: requirement.audit
        });
      }
    }
    const results = await REQUIREMENTS_COLLECTION.insertMany(newRequirements);
    logger.info(`${results.insertedCount} documents inserted in requirements collection`);

    // Remove attribute requirements of projectss only if migrations is successsfull
    await removeAttributeFromProjectCollection();
  } catch (e) {
    logger.error(`Error migrating project requirements to collection requirements -> ${e}`);
  }
}

async function removeAttributeFromProjectCollection(): Promise<void> {
  logger.info('Start removing requirements attribute from collection projects');
  try {
    await PROJECTS_COLLECTION.updateMany({}, { $unset: { requirements: 1 } });
    logger.info(`Requirements attribute removed from collection projects`);
  } catch (e) {
    logger.error(`Error removing requirements attribute from collection projects -> ${e}`);
  }
}

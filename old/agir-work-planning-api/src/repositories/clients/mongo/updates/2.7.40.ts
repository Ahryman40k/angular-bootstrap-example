import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.40');
let TAXONOMIES_COLLECTION: Collection;
let PROJECTS_COLLECTION: Collection;

/**
 * For V2.7.40 update project requirements
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
    PROJECTS_COLLECTION = db.collection(constants.mongo.collectionNames.PROJECTS);

    await deleteGroupTaxonomies(['requirementRequestor', 'requirementType']);
    await deleteTaxonomyGroups(['requirementRequestor', 'requirementType']);

    await insertTaxonomies(getNewProjectRequirementTypeTaxonomies());
    await insertTaxonomies(getNewTaxonomyGroupTaxonomies());

    await updateProjectRequirements();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.40 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  const insertResults = await TAXONOMIES_COLLECTION.insertMany(taxonomies);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
}

/**
 * Remove all documents from taxonomy group in taxonomies collection
 * @param codes
 */
async function deleteGroupTaxonomies(groups: string | string[]): Promise<void> {
  const result = await TAXONOMIES_COLLECTION.deleteMany({
    group: { $in: groups }
  });
  logger.info(`${result.deletedCount} taxonomies DELETED`);
}

/**
 * Remove documents from group Taxonomy Group in taxonomies collection
 * @param codes
 */
async function deleteTaxonomyGroups(codes: string | string[]): Promise<void> {
  const result = await TAXONOMIES_COLLECTION.deleteMany({
    group: TaxonomyGroup.taxonomyGroup,
    code: { $in: codes }
  });
  logger.info(`${result.deletedCount} taxonomies DELETED`);
}

async function updateProjectRequirements(): Promise<void> {
  await PROJECTS_COLLECTION.updateMany(
    {},
    { $unset: { 'requirements.categoryId': 1, 'requirements.requestorId': 1, 'requirements.referenceIds': 1 } }
  );

  await PROJECTS_COLLECTION.updateMany(
    {
      'requirements.typeId': {
        $in: ['other', 'programmation']
      }
    },
    {
      $set: {
        'requirements.$[elem].typeId': 'otherRequirements'
      }
    },
    { arrayFilters: [{ 'elem.typeId': { $in: ['other', 'programmation'] } }] }
  );

  await PROJECTS_COLLECTION.updateMany(
    {
      'requirements.typeId': {
        $in: ['work']
      }
    },
    {
      $set: {
        'requirements.$[elem].typeId': 'coordinationWork'
      }
    },
    { arrayFilters: [{ 'elem.typeId': 'work' }] }
  );
}

function getNewProjectRequirementTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'projectRequirementType',
      code: 'rehabAqBeforePcpr',
      label: {
        fr: 'Réhab AQ avant PCPR',
        en: 'Réhab AQ avant PCPR'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'rehabAqBeforePrcpr',
      label: {
        fr: 'Réhab AQ avant PRCPR',
        en: 'Réhab AQ avant PRCPR'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'rehabEgBeforePcpr',
      label: {
        fr: 'Réhab EG avant PCPR',
        en: 'Réhab EG avant PCPR'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'rehabEgBeforePrcpr',
      label: {
        fr: 'Réhab EG avant PRCPR',
        en: 'Réhab EG avant PRCPR'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'espBeforePcpr',
      label: {
        fr: 'Travaux ESP avant PCPR',
        en: 'Travaux ESP avant PCPR'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'espBeforePrcpr',
      label: {
        fr: 'Travaux ESP avant PRCPR',
        en: 'Travaux ESP avant PRCPR'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'coordinationObstacles',
      label: {
        fr: 'Coordination avec les entraves des autres partenaires',
        en: 'Coordination with obstacles from other partners'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'coordinationWork',
      label: {
        fr: 'Coordination avec les travaux dans le secteur',
        en: 'Coordination with work in the sector'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'recommendedIntegration',
      label: {
        fr: 'Intégration recommandée',
        en: 'Recommended integration'
      }
    },
    {
      group: 'projectRequirementType',
      code: 'otherRequirements',
      label: {
        fr: 'Autres exigences',
        en: 'Other requirements'
      }
    }
  ];
}

function getNewTaxonomyGroupTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'projectRequirementType',
      group: 'taxonomyGroup',
      label: {
        fr: "Type d'exigences",
        en: 'Requirement type'
      },
      description: {
        fr: "Ce groupe définit les types d'exigences.",
        en: 'This group defines the requirement types.'
      },
      properties: {
        category: 'project',
        permission: 'Write'
      }
    }
  ];
}

export const taxos2740 = [...getNewProjectRequirementTypeTaxonomies(), ...getNewTaxonomyGroupTaxonomies()];

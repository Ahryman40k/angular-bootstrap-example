import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.38');
let TAXONOMIES_COLLECTION: Collection;
let INTERVENTIONS_COLLECTION: Collection;

/**
 * For V2.7.38 update intervention requirements
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
    INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);

    await insertTaxonomies(getNewInterventionRequirementTypeTaxonomies());
    await insertTaxonomies(getNewTaxonomyGroupTaxonomies());

    await updateInterventionRequirements();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.38 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  const insertResults = await TAXONOMIES_COLLECTION.insertMany(taxonomies);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
}

async function updateInterventionRequirements(): Promise<void> {
  await INTERVENTIONS_COLLECTION.updateMany(
    {},
    { $unset: { 'requirements.categoryId': 1, 'requirements.referenceIds': 1 } }
  );

  await INTERVENTIONS_COLLECTION.updateMany(
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

  await INTERVENTIONS_COLLECTION.updateMany(
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

function getNewInterventionRequirementTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'interventionRequirementType',
      code: 'rehabAqBeforePcpr',
      label: {
        fr: 'Réhab AQ avant PCPR',
        en: 'Réhab AQ avant PCPR'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'rehabAqBeforePrcpr',
      label: {
        fr: 'Réhab AQ avant PRCPR',
        en: 'Réhab AQ avant PRCPR'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'rehabEgBeforePcpr',
      label: {
        fr: 'Réhab EG avant PCPR',
        en: 'Réhab EG avant PCPR'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'rehabEgBeforePrcpr',
      label: {
        fr: 'Réhab EG avant PRCPR',
        en: 'Réhab EG avant PRCPR'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'espBeforePcpr',
      label: {
        fr: 'Travaux ESP avant PCPR',
        en: 'Travaux ESP avant PCPR'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'espBeforePrcpr',
      label: {
        fr: 'Travaux ESP avant PRCPR',
        en: 'Travaux ESP avant PRCPR'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'coordinationObstacles',
      label: {
        fr: 'Coordination avec les entraves des autres partenaires',
        en: 'Coordination with obstacles from other partners'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'coordinationWork',
      label: {
        fr: 'Coordination avec les travaux dans le secteur',
        en: 'Coordination with work in the sector'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'recommendedIntegration',
      label: {
        fr: 'Intégration recommandée',
        en: 'Recommended integration'
      }
    },
    {
      group: 'interventionRequirementType',
      code: 'noConflict',
      label: {
        fr: 'Aucun conflit',
        en: 'No conflict'
      }
    },
    {
      group: 'interventionRequirementType',
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
      code: 'interventionRequirementType',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: "Type d'exigences",
        en: 'Requirement type'
      },
      description: {
        fr: "Ce groupe définit les types d'exigences.",
        en: 'This group defines the requirement types.'
      },
      properties: {
        category: 'intervention',
        permission: 'Write'
      }
    }
  ];
}

export const taxos2738 = [...getNewInterventionRequirementTypeTaxonomies(), ...getNewTaxonomyGroupTaxonomies()];

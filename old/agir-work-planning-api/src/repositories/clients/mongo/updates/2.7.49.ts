import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.49');
let TAXONOMIES_COLLECTION: Collection;

/**
 * For V2.7.49 update intervention and project requirements
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

    await insertTaxonomies(getRequirementTypeTaxonomies());
    await insertTaxonomies(getRequirementSubtypeTaxonomies());
    await insertTaxonomies(getRequirementTargetTypeTaxonomies());

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.49 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  const insertResults = await TAXONOMIES_COLLECTION.insertMany(taxonomies);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
}

function getRequirementTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'requirementType',
      code: 'other',
      label: {
        fr: 'Autre',
        en: 'Other'
      }
    },
    {
      group: 'requirementType',
      code: 'programmation',
      label: {
        fr: 'Programmation',
        en: 'Programmation'
      }
    },
    {
      group: 'requirementType',
      code: 'work',
      label: {
        fr: 'Réalisation de travaux',
        en: 'Work'
      }
    }
  ];
}

function getRequirementSubtypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'requirementSubtype',
      code: 'coordinationObstacles',
      label: {
        fr: 'Coordination avec les entraves des autres partenaires',
        en: 'Coordination with obstacles from other partners'
      },
      properties: {
        requirementType: 'programmation'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'espBeforePcpr',
      label: {
        fr: 'Travaux ESP avant PCPR',
        en: 'Travaux ESP avant PCPR'
      },
      properties: {
        requirementType: 'work'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'recommendedIntegration',
      label: {
        fr: 'Intégration recommandée',
        en: 'Recommended integration'
      },
      properties: {
        requirementType: 'programmation'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'espBeforePrcpr',
      label: {
        fr: 'Travaux ESP avant PRCPR',
        en: 'Travaux ESP avant PRCPR'
      },
      properties: {
        requirementType: 'work'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'rehabAqBeforePcpr',
      label: {
        fr: 'Réhab AQ avant PCPR',
        en: 'Réhab AQ avant PCPR'
      },
      properties: {
        requirementType: 'work'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'rehabEgBeforePcpr',
      label: {
        fr: 'Réhab EG avant PCPR',
        en: 'Réhab EG avant PCPR'
      },
      properties: {
        requirementType: 'work'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'rehabEgBeforePrcpr',
      label: {
        fr: 'Réhab EG avant PRCPR',
        en: 'Réhab EG avant PRCPR'
      },
      properties: {
        requirementType: 'work'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'rehabAqBeforePrcpr',
      label: {
        fr: 'Réhab AQ avant PRCPR',
        en: 'Réhab AQ avant PRCPR'
      },
      properties: {
        requirementType: 'work'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'coordinationWork',
      label: {
        fr: 'Coordination avec les travaux dans le secteur',
        en: 'Coordination with work in the sector'
      },
      properties: {
        requirementType: 'programmation'
      }
    },
    {
      group: 'requirementSubtype',
      code: 'otherRequirements',
      label: {
        fr: 'Autres exigences',
        en: 'Other requirements'
      },
      properties: {
        requirementType: 'other'
      }
    }
  ];
}

function getRequirementTargetTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'requirementTargetType',
      code: 'intervention',
      label: {
        fr: 'Intervention',
        en: 'Intervention'
      }
    },
    {
      group: 'requirementTargetType',
      code: 'project',
      label: {
        fr: 'Projet',
        en: 'Project'
      }
    }
  ];
}

export const taxos2749 = [
  ...getRequirementTypeTaxonomies(),
  ...getRequirementSubtypeTaxonomies(),
  ...getRequirementTargetTypeTaxonomies()
];

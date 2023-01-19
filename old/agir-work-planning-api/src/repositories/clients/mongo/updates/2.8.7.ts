import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.7`;
const logger = createLogger(`mongo/${VERSION}`);

let taxonomiesCollection: MongoDb.Collection<any> = null;
/**
 * need to add a taxonomies for the comment type risk.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertDocumentTaxonomy();
  const seconds = Date.now() - startTime;
  logger.info(`Document taxonomies updated in ${seconds} seconds`);
}

// tslint:disable-next-line: max-func-body-length
async function insertDocumentTaxonomy() {
  const taxonomies: ITaxonomy[] = [
    {
      group: 'submissionRequirementMention',
      code: 'beforeTender',
      label: {
        fr: "Avant appel d'offre",
        en: 'Before tender'
      }
    },

    {
      group: 'submissionRequirementMention',
      code: 'afterTender',
      label: {
        fr: 'Après appel d’offre',
        en: 'After tender'
      }
    },
    {
      group: 'submissionRequirementType',
      code: 'programmation',
      label: {
        fr: 'Programmation',
        en: 'Programmation'
      }
    },

    {
      group: 'submissionRequirementType',
      code: 'work',
      label: {
        fr: 'Réalisation des travaux',
        en: 'Work'
      }
    },

    {
      group: 'submissionRequirementType',
      code: 'completionPeriod',
      label: {
        fr: 'Période de réalisation',
        en: 'Completion period'
      }
    },

    {
      group: 'submissionRequirementType',
      code: 'other',
      label: {
        fr: 'Autre',
        en: 'Other'
      }
    },

    {
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
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
      group: 'submissionRequirementSubtype',
      code: 'schoolHolidays',
      label: {
        fr: 'Vacances scolaires',
        en: 'School holidays'
      },
      properties: {
        requirementType: 'completionPeriod'
      }
    },

    {
      group: 'submissionRequirementSubtype',
      code: 'constructionHolidays',
      label: {
        fr: 'Vacances de la construction',
        en: 'Construction holidays'
      },
      properties: {
        requirementType: 'completionPeriod'
      }
    },

    {
      group: 'submissionRequirementSubtype',
      code: 'spring',
      label: {
        fr: 'Printemps',
        en: 'Spring'
      },
      properties: {
        requirementType: 'completionPeriod'
      }
    },

    {
      group: 'submissionRequirementSubtype',
      code: 'autumn',
      label: {
        fr: 'Automne',
        en: 'Autumn'
      },
      properties: {
        requirementType: 'completionPeriod'
      }
    },

    {
      group: 'submissionRequirementSubtype',
      code: 'springAutumn',
      label: {
        fr: 'Printemps/Automne',
        en: 'Spring/Autumn'
      },
      properties: {
        requirementType: 'completionPeriod'
      }
    },

    {
      group: 'submissionRequirementSubtype',
      code: 'winter',
      label: {
        fr: 'Hiver',
        en: 'Winter'
      },
      properties: {
        requirementType: 'completionPeriod'
      }
    },
    {
      group: 'submissionRequirementSubtype',
      code: 'other',
      label: {
        fr: 'Autre',
        en: 'Other'
      },
      properties: {
        requirementType: 'other'
      }
    }
  ];

  await taxonomiesCollection.insertMany(taxonomies);
}

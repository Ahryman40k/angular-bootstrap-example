import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.32');
let taxonomiesCollection: MongoDb.Collection;

/**
 * For V2.7.32 we need to add the new group taxonomyGroup
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await insertTaxonomies(getTaxonomyGroupTaxonomies());

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.32 executed in ${milliseconds} milliseconds`);
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  try {
    const insertResults = await taxonomiesCollection.insertMany(taxonomies);
    logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
  } catch (e) {
    logger.info(`Insert taxonomies error -> ${e}`);
  }
}

// tslint:disable-next-line: max-func-body-length
function getTaxonomyGroupTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'city',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Ville-liée',
        en: 'Linked-city'
      },
      description: {
        fr: 'Ce groupe définit les villes-liées.',
        en: 'This group defines the linked-cities.'
      },
      properties: {
        category: 'agir',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'bridge',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Pont',
        en: 'Bridge'
      },
      description: {
        fr: 'Ce groupe définit les ponts.',
        en: 'This group defines the bridges.'
      },
      properties: {
        category: 'agir',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'rtuProjectStatus',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Statuts des projets Info-RTU',
        en: 'Info-RTU project statuses'
      },
      description: {
        fr: 'Ce groupe définit les statuts des projets Info-RTU.',
        en: 'This group defines the Info-RTU project statuses.'
      },
      properties: {
        category: 'infoRtu',
        permission: 'Write'
      }
    },
    {
      code: 'infoRtuPartner',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Partenaire Info-RTU',
        en: 'Info-RTU partner'
      },
      description: {
        fr: 'Ce groupe définit les partenaires Info-RTU.',
        en: 'This group defines the Info-RTU partners.'
      },
      properties: {
        category: 'infoRtu',
        permission: 'Write'
      }
    },
    {
      code: 'rtuProjectPhase',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Phases des projets Info-RTU',
        en: 'Info-RTU project phases'
      },
      description: {
        fr: 'Ce groupe définit les phases des projets Info-RTU.',
        en: 'This group defines the Info-RTU project phases.'
      },
      properties: {
        category: 'infoRtu',
        permission: 'Write'
      }
    },
    {
      code: 'rtuImportStatus',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Statuts des importations Info-RTU',
        en: 'Info-RTU import statuses'
      },
      description: {
        fr: 'Ce groupe définit les statuts des importations Info-RTU.',
        en: 'This group defines the Info-RTU import statuses.'
      },
      properties: {
        category: 'infoRtu',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'exportStatus',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Statuts des exportations Info-RTU',
        en: 'Info-RTU export statuses'
      },
      description: {
        fr: 'Ce groupe définit les statuts des exportations Info-RTU.',
        en: 'This group defines the Info-RTU export statuses.'
      },
      properties: {
        category: 'infoRtu',
        permission: 'ModificationOnly'
      }
    }
  ];
}

export const taxos2732 = getTaxonomyGroupTaxonomies();

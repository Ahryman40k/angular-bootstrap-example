import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.74');
let TAXONOMIES_COLLECTION: Collection;

/**
 * For V2.7.74 add submissionStatus in taxonomyGroup
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
    await insertTaxonomies(getNewsubmissionStatusTaxonomies());
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.74 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  const insertResults = await TAXONOMIES_COLLECTION.insertMany(taxonomies);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
}

function getNewsubmissionStatusTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'submissionStatus',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: 'Statuts des soumissions',
        en: 'Submission statuses'
      },
      description: {
        fr: 'Ce groupe définit les statuts des soumissions.',
        en: 'This group defines the submission statuses.'
      },
      properties: {
        category: 'programBook',
        permission: 'ModificationOnly'
      }
    },
    {
      code: 'submissionProgressStatus',
      group: TaxonomyGroup.taxonomyGroup,
      label: {
        fr: "États d'avancement des soumissions",
        en: 'Submission progress statuses'
      },
      description: {
        fr: "Ce groupe définit les états d'avancement des soumissions.",
        en: 'This group defines the submission progress statuses.'
      },
      properties: {
        category: 'programBook',
        permission: 'Write'
      }
    }
  ];
}

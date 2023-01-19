import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.52');
let taxonomiesCollection: MongoDb.Collection;

/**
 * For V2.7.52 we need to add the new group taxonomyGroup
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await insertTaxonomies(getTaxonomyGroupTaxonomies());

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.52 executed in ${milliseconds} milliseconds`);
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

function getTaxonomyGroupTaxonomies(): ITaxonomy[] {
  const taxonomyGroup = 'taxonomyGroup';
  return [
    {
      code: 'requirementType',
      group: taxonomyGroup,
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
    },
    {
      code: 'requirementSubtype',
      group: taxonomyGroup,
      label: {
        fr: "Sous-type d'exigences",
        en: 'Requirement subtype'
      },
      description: {
        fr: "Ce groupe définit les sous-types d'exigences.",
        en: 'This group defines the requirement subtypes.'
      },
      properties: {
        category: 'project',
        permission: 'Write'
      }
    }
  ];
}

export const taxos2752 = getTaxonomyGroupTaxonomies();

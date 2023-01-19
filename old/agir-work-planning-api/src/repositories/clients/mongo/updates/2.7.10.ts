import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';
import { isEmpty } from '../../../../utils/utils';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.10');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.10 we need to add the taxonomy group rtuProjectStatusTaxonomies,rtuProjectPhaseTaxonomies
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  const rtuProjectStatusTaxonomies = getRtuProjectStatusTaxonomies();
  const rtuProjectPhaseTaxonomies = getRtuProjectPhaseTaxonomies();

  await upsertTaxonomies(rtuProjectStatusTaxonomies);
  await upsertTaxonomies(rtuProjectPhaseTaxonomies);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.10 executed in ${milliseconds} milliseconds`);
}

export const taxos2710: ITaxonomy[] = [...getRtuProjectStatusTaxonomies(), ...getRtuProjectPhaseTaxonomies()];

async function upsertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`upsert assetType  ${TAXONOMIES_COLLECTION.collectionName}`);
  try {
    for (const taxonomy of taxonomies) {
      const setValue = {
        label: taxonomy.label
      };
      // tslint:disable:no-string-literal
      if (!isEmpty(taxonomy.properties)) {
        setValue['properties'] = taxonomy.properties;
      }
      if (!isEmpty(taxonomy.displayOrder)) {
        setValue['displayOrder'] = taxonomy.displayOrder;
      }
      await TAXONOMIES_COLLECTION.updateOne(
        { group: taxonomy.group, code: taxonomy.code },
        { $set: setValue },
        { upsert: true }
      );
    }
  } catch (e) {
    logger.error(`Create Service taxonomies error -> ${e}`);
  }
}

function getRtuProjectStatusTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'rtuProjectStatus',
      code: 'AC',
      label: {
        en: 'Active',
        fr: 'Actif'
      }
    },
    {
      group: 'rtuProjectStatus',
      code: 'AN',
      label: {
        en: 'Canceled',
        fr: 'Annulé'
      }
    },
    {
      group: 'rtuProjectStatus',
      code: 'CO',
      label: {
        en: 'Completed',
        fr: 'Complété'
      }
    },
    {
      group: 'rtuProjectStatus',
      code: 'P',
      label: {
        en: 'In design',
        fr: 'En préparation'
      }
    }
  ];
}

function getRtuProjectPhaseTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'rtuProjectPhase',
      code: 'preProject',
      label: {
        en: 'Pre-project',
        fr: 'Avant projet'
      }
    },
    {
      group: 'rtuProjectPhase',
      code: 'detailedDesign',
      label: {
        en: 'Detailed design',
        fr: 'Conception détaillée'
      }
    },
    {
      group: 'rtuProjectPhase',
      code: 'preliminaryConception',
      label: {
        en: 'Preliminary conception',
        fr: 'Conception préliminaire'
      }
    },
    {
      group: 'rtuProjectPhase',
      code: 'annualPlanning',
      label: {
        en: 'Annual planning',
        fr: 'Planification annuelle'
      }
    },
    {
      group: 'rtuProjectPhase',
      code: 'execution',
      label: {
        en: 'Execution',
        fr: 'Réalisation'
      }
    }
  ];
}

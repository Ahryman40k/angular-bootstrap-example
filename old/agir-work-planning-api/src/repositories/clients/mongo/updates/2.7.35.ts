import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.35');
let TAXONOMIES_COLLECTION: Collection;
let INTERVENTIONS_COLLECTION: Collection;

/**
 * For V2.7.35 update intervention decision refused
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
    INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
    const newInterventionDecisionRefused = getNewInterventionDecisionRefusedTaxonomies();
    const plannedIntegratedDecisionRefused = getPlannedIntegratedDecisionRefused();

    await deleteOldDecisionTaxonomies();

    await insertTaxonomies(newInterventionDecisionRefused);
    await updateTaxonomies(plannedIntegratedDecisionRefused);

    await updateInterventions();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.35 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function deleteOldDecisionTaxonomies(): Promise<void> {
  const codes = ['recommended', 'other'];

  const result = await TAXONOMIES_COLLECTION.deleteMany({
    group: TaxonomyGroup.interventionDecisionRefused,
    code: { $in: codes }
  });
  logger.info(`${result.deletedCount} intervention decision refused ${codes.join()} DELETED`);
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  const insertResults = await TAXONOMIES_COLLECTION.insertMany(taxonomies);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
}

async function updateTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`update label  ${TAXONOMIES_COLLECTION.collectionName}`);
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
}

async function updateInterventions(): Promise<void> {
  await INTERVENTIONS_COLLECTION.updateMany(
    {
      'decisions.refusalReasonId': {
        $in: ['recommended']
      }
    },
    {
      $set: {
        'decisions.$[elem].refusalReasonId': 'plannedIntegrated'
      }
    },
    { arrayFilters: [{ 'elem.refusalReasonId': 'recommended' }] }
  );

  await INTERVENTIONS_COLLECTION.updateMany(
    {
      'decisions.refusalReasonId': {
        $in: ['other']
      }
    },
    {
      $set: {
        'decisions.$[elem].refusalReasonId': 'mobility'
      }
    },
    { arrayFilters: [{ 'elem.refusalReasonId': 'other' }] }
  );
}

// tslint:disable-next-line: max-func-body-length
function getNewInterventionDecisionRefusedTaxonomies(): ITaxonomy[] {
  return [
    {
      group: TaxonomyGroup.interventionDecisionRefused,
      code: 'sectionNoLongerExists',
      label: {
        fr: "Ce tronçon n'existe plus",
        en: 'This section no longer exists'
      }
    },
    {
      group: TaxonomyGroup.interventionDecisionRefused,
      code: 'workAlreadyPlannedOnThisSection',
      label: {
        fr: "Travaux planifié sur ce tronçon par l'arrondissement (année en cours), attendre la fin du moratoire.",
        en: 'Work planned on this section by the borough (current year), wait until the end of the moratorium.'
      }
    }
  ];
}

function getPlannedIntegratedDecisionRefused(): ITaxonomy[] {
  return [
    {
      group: TaxonomyGroup.interventionDecisionRefused,
      code: 'plannedIntegrated',
      label: {
        fr: 'PI planifié dans le futur',
        en: 'PI planned in the futur'
      }
    }
  ];
}

export const taxos2735 = [...getNewInterventionDecisionRefusedTaxonomies(), ...getPlannedIntegratedDecisionRefused()];

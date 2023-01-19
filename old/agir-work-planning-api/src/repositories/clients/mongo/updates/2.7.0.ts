import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { set } from 'lodash';
import { Collection, Db } from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.0');

let TAXONOMIES_COLLECTION: Collection;

const NEXO_IMPORT_STATUSES = [
  {
    group: 'nexoImportStatus',
    code: 'pending',
    label: {
      fr: 'En attente',
      en: 'Pending'
    }
  },
  {
    group: 'nexoImportStatus',
    code: 'inProgress',
    label: {
      fr: 'En cours',
      en: 'In progress'
    }
  },
  {
    group: 'nexoImportStatus',
    code: 'success',
    label: {
      fr: 'Succès',
      en: 'Success'
    }
  },
  {
    group: 'nexoImportStatus',
    code: 'failure',
    label: {
      fr: 'Échec',
      en: 'Failure'
    }
  }
];

const MODIFICATION_TYPES = [
  {
    group: 'modificationType',
    code: 'creation',
    label: {
      fr: 'Création',
      en: 'Creation'
    }
  },
  {
    group: 'modificationType',
    code: 'modification',
    label: {
      fr: 'Modification',
      en: 'Modification'
    }
  },
  {
    group: 'modificationType',
    code: 'deletion',
    label: {
      fr: 'Suppression',
      en: 'Deletion'
    }
  }
];

const NEXO_IMPORT_FILE_TYPES = [
  {
    group: 'nexoFileType',
    code: 'interventionsSE',
    label: {
      fr: `Interventions Service de l'eau`,
      en: `Interventions Service de l'eau`
    },
    displayOrder: 1
  },
  {
    group: 'nexoFileType',
    code: 'interventionsBudgetSE',
    label: {
      fr: 'Interventions - Données budgétaires',
      en: 'Interventions - Données budgétaires'
    },
    displayOrder: 2
  },
  {
    group: 'nexoFileType',
    code: 'rehabAqConception',
    label: {
      fr: 'Réhab aqueduc - Données conception',
      en: 'Réhab aqueduc - Données conception'
    },
    displayOrder: 3
  },
  {
    group: 'nexoFileType',
    code: 'rehabEgConception',
    label: {
      fr: 'Réhab égoût - Données conception',
      en: 'Réhab égoût - Données conception'
    },
    displayOrder: 4
  }
];

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  try {
    await upsertTaxonomies(NEXO_IMPORT_STATUSES);
    await upsertTaxonomies(MODIFICATION_TYPES);
    await upsertTaxonomies(NEXO_IMPORT_FILE_TYPES);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.0 executed in ${milliseconds} milliseconds`);
}

async function upsertTaxonomies(taxonomies: ITaxonomy[]) {
  for (const taxonomy of taxonomies) {
    const values = {
      group: taxonomy.group,
      code: taxonomy.code,
      label: {
        fr: taxonomy.label.fr,
        en: taxonomy.label.en
      }
    };
    if (taxonomy.displayOrder) {
      set(values, 'displayOrder', taxonomy.displayOrder);
    }
    await TAXONOMIES_COLLECTION.updateOne(
      { group: taxonomy.group, code: taxonomy.code },
      {
        $set: values
      },
      { upsert: true }
    );
  }
}

import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.50.79');

export default async function update(db: MongoDb.Db): Promise<void> {
  let err = '';
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  try {
    await insertRequestorTaxonomies(taxonomiesCollection);
  } catch (e) {
    err = `${err}\nError -> ${e}`;
  }

  if (err) {
    logger.info(`${err}`);
  }
}

// tslint:disable-next-line:max-func-body-length
async function insertRequestorTaxonomies(taxonomiesCollection: MongoDb.Collection) {
  const taxonomies: ITaxonomy[] = [
    {
      group: 'requestor',
      code: 'signals',
      label: {
        fr: 'ERA (Feux)',
        en: 'Signals'
      }
    },
    {
      group: 'requestor',
      code: 'publicWorksRoad',
      label: {
        fr: 'DGAC (Voirie et Cyclable)',
        en: 'DGAC (Voirie et Cyclable)'
      }
    },
    {
      group: 'requestor',
      code: 'sgpi',
      label: {
        fr: 'SGPI - Immobilier',
        en: 'SGPI - Immobilier'
      }
    },
    {
      group: 'requestor',
      code: 'dtac',
      label: {
        fr: 'Section Vélo',
        en: 'Section Vélo'
      }
    },
    {
      group: 'requestor',
      code: 'gpdu',
      label: {
        fr: 'GP-DU',
        en: 'GP-DU'
      }
    },
    {
      group: 'requestor',
      code: 'gpdm',
      label: {
        fr: 'GP-DM',
        en: 'GP-DM'
      }
    },
    {
      group: 'requestor',
      code: 'gppart',
      label: {
        fr: 'GP-SIRR-Partenaires',
        en: 'GP-SIRR-Partenaires'
      }
    },
    {
      group: 'requestor',
      code: 'gpville',
      label: {
        fr: 'GP-SIRR-Ville',
        en: 'GP-SIRR-Ville'
      }
    },
    {
      group: 'requestor',
      code: 'senv',
      label: {
        fr: "Service de l'environnement",
        en: "Service de l'environnement"
      }
    },
    {
      group: 'requestor',
      code: 'ican',
      label: {
        fr: 'Infrastructure Canada',
        en: 'Infrastructure Canada'
      }
    }
  ];

  for (const taxonomy of taxonomies) {
    await taxonomiesCollection.deleteOne({
      group: taxonomy.group,
      code: taxonomy.code
    });
  }
  await taxonomiesCollection.insertMany(taxonomies);
}

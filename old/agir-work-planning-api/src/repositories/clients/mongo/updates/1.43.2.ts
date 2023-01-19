import * as MongoDb from 'mongodb';

import { TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.43.2');

/**
 * For V1.43.2 We need to add taxonomies for the external reference type.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertTaxonomies(taxonomiesCollection);
}

async function insertTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomy for external reference type`);
  const taxonomies = [
    {
      group: TaxonomyGroup.externalReferenceType,
      code: 'infoRTUReferenceNumber',
      label: {
        fr: 'Numéro de référence - Info RTU',
        en: 'Info RTU reference number'
      }
    },
    {
      group: TaxonomyGroup.externalReferenceType,
      code: 'requestorReferenceNumber',
      label: {
        fr: 'Numéro de référence requérant',
        en: 'Requestor reference number'
      }
    },
    {
      group: TaxonomyGroup.externalReferenceType,
      code: 'ptiNumber',
      label: {
        fr: "Numéro de programme triennal d'immobilisations",
        en: 'Immobilizations triennial program number'
      }
    }
  ];
  for (const taxonomy of taxonomies) {
    try {
      await taxonomiesCollection.insertOne(taxonomy);
    } catch (e) {
      logger.error(e, `Creating group ${TaxonomyGroup.externalReferenceType} and code ${taxonomy.code} failed.`);
      return;
    }
  }
}

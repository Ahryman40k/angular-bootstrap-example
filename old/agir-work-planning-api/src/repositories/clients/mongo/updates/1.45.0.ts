import { DocumentStatus, DocumentType, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.45.0');
let taxonomiesCollection: MongoDb.Collection<any> = null;
/**
 * For V1.45.0 We need to add a taxonomy for the comment type risk.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  // Remove obsolete document taxonomies
  await deleteDocumentTaxonomy();
  await insertDocumentTaxonomy();
  const seconds = Date.now() - startTime;
  logger.info(`Document taxonomies updated in ${seconds} seconds`);
}

async function deleteDocumentTaxonomy() {
  await taxonomiesCollection.deleteMany({ group: 'documentStatus' });
  await taxonomiesCollection.deleteMany({ group: 'documentType' });
  await taxonomiesCollection.deleteMany({ group: 'documentCategory' });
}

async function insertDocumentTaxonomy() {
  const taxonomies: ITaxonomy[] = [
    {
      group: TaxonomyGroup.documentType,
      code: DocumentType.other,
      label: {
        fr: 'Autre',
        en: 'Other'
      }
    },
    {
      group: TaxonomyGroup.documentStatus,
      code: DocumentStatus.pending,
      label: {
        fr: 'En attente',
        en: 'Pending'
      }
    },
    {
      group: TaxonomyGroup.documentStatus,
      code: DocumentStatus.refused,
      label: {
        fr: 'Refusé',
        en: 'Refused'
      }
    },
    {
      group: TaxonomyGroup.documentStatus,
      code: DocumentStatus.validated,
      label: {
        fr: 'Validé',
        en: 'Validated'
      }
    }
  ];
  await taxonomiesCollection.insertMany(taxonomies);
}

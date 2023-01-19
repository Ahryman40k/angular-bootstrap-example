import { AdditionalCostType, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.48.0');
let taxonomiesCollection: MongoDb.Collection<any> = null;
/**
 * For V1.48.0 We need to add a taxonomy for the comment type risk.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deleteAdditionalCostTaxonomy();
  await insertAdditionalCostTaxonomy();
  const seconds = Date.now() - startTime;
  logger.info(`Additional cost taxonomies updated in ${seconds} seconds`);
}

async function deleteAdditionalCostTaxonomy() {
  await taxonomiesCollection.deleteMany({ group: 'additionalCost' });
}

async function insertAdditionalCostTaxonomy() {
  const taxonomies: ITaxonomy[] = [
    {
      group: TaxonomyGroup.additionalCost,
      code: AdditionalCostType.professionalServices,
      displayOrder: 1,
      label: {
        fr: 'Services professionnels',
        en: 'Professional services'
      }
    },
    {
      group: TaxonomyGroup.additionalCost,
      code: AdditionalCostType.workExpenditures,
      displayOrder: 2,
      label: {
        fr: 'Travaux',
        en: 'Work expenditures'
      }
    },
    {
      group: TaxonomyGroup.additionalCost,
      code: AdditionalCostType.contingency,
      displayOrder: 3,
      label: {
        fr: 'Incidences',
        en: 'Contingency'
      }
    },
    {
      group: TaxonomyGroup.additionalCost,
      code: AdditionalCostType.others,
      displayOrder: 4,
      label: {
        fr: 'Autres',
        en: 'Others '
      }
    }
  ];
  await taxonomiesCollection.insertMany(taxonomies);
}

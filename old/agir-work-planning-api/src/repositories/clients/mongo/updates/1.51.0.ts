import { ITaxonomy, PriorityCode, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.51.0');
let taxonomiesCollection: MongoDb.Collection<any> = null;
/**
 * For V1.51.0 We need to update priority taxonomies.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deletePriorityTaxonomy();
  await insertPriorityTaxonomy();
  const seconds = Date.now() - startTime;
  logger.info(`Priority taxonomies updated in ${seconds} seconds`);
}

async function deletePriorityTaxonomy() {
  await taxonomiesCollection.deleteMany({ group: TaxonomyGroup.priorityType });
}

async function insertPriorityTaxonomy() {
  const taxonomies: ITaxonomy[] = [
    {
      group: TaxonomyGroup.priorityType,
      code: PriorityCode.veryHighPriority,
      label: {
        fr: `${PriorityCode.veryHighPriority} - TrÃ¨s haute prioritÃ©`,
        en: `${PriorityCode.veryHighPriority} - Very high priority`
      },
      displayOrder: 1
    },
    {
      group: TaxonomyGroup.priorityType,
      code: PriorityCode.highPriority,
      label: {
        fr: `${PriorityCode.highPriority} - Haute prioritÃ©`,
        en: `${PriorityCode.highPriority} - High priority`
      },
      displayOrder: 2
    },
    {
      group: TaxonomyGroup.priorityType,
      code: PriorityCode.mediumPriority,
      label: {
        fr: `${PriorityCode.mediumPriority} - Moyenne prioritÃ©`,
        en: `${PriorityCode.mediumPriority} - Medium priority`
      },
      displayOrder: 3
    },
    {
      group: TaxonomyGroup.priorityType,
      code: PriorityCode.lowPriority,
      label: {
        fr: `${PriorityCode.lowPriority} - Basse prioritÃ©`,
        en: `${PriorityCode.lowPriority} - Low priority`
      },
      displayOrder: 4
    }
  ];
  await taxonomiesCollection.insertMany(taxonomies);
}

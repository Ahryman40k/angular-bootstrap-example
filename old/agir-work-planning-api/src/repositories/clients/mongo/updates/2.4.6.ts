import { ITaxonomy, PriorityCode, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.4.6');
let taxonomiesCollection: MongoDb.Collection<any> = null;
/**
 * For V2.4.6 We need to update priority taxonomies.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deletePriorityTaxonomy();
  await insertPriorityTaxonomy();
  const milliseconds = Date.now() - startTime;
  logger.info(`Priority taxonomies updated in ${milliseconds} milliseconds`);
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
        fr: `1 - Très haute priorité`,
        en: `1 - Very high priority`
      },
      displayOrder: 4
    },
    {
      group: TaxonomyGroup.priorityType,
      code: PriorityCode.highPriority,
      label: {
        fr: `2 - Haute priorité`,
        en: `2 - High priority`
      },
      displayOrder: 3
    },
    {
      group: TaxonomyGroup.priorityType,
      code: PriorityCode.mediumPriority,
      label: {
        fr: `3 - Moyenne priorité`,
        en: `3 - Medium priority`
      },
      displayOrder: 2
    },
    {
      group: TaxonomyGroup.priorityType,
      code: PriorityCode.lowPriority,
      label: {
        fr: `4 - Basse priorité`,
        en: `4 - Low priority`
      },
      displayOrder: 1
    }
  ];
  await taxonomiesCollection.insertMany(taxonomies);
}

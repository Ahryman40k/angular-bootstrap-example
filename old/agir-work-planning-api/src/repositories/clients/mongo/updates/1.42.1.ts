import * as MongoDb from 'mongodb';

import { MedalType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.42.1');

/**
 * For V1.42.1 we need to add new taxonomies for the medals of projects and interventions.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await deleteMedalTaxonomies(taxonomiesCollection);
  await insertMedalTaxonomies(taxonomiesCollection);
}

async function insertMedalTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomies for medalType`);
  const medalTypeTaxonomies = [
    {
      group: 'medalType',
      code: MedalType.platinum,
      label: {
        fr: 'Platine',
        en: 'Platinum'
      },
      properties: {
        weight: 4
      }
    },
    {
      group: 'medalType',
      code: MedalType.gold,
      label: {
        fr: 'Or',
        en: 'Gold'
      },
      properties: {
        weight: 3
      }
    },
    {
      group: 'medalType',
      code: MedalType.silver,
      label: {
        fr: 'Argent',
        en: 'Silver'
      },
      properties: {
        weight: 2
      }
    },
    {
      group: 'medalType',
      code: MedalType.bronze,
      label: {
        fr: 'Bronze',
        en: 'Bronze'
      },
      properties: {
        weight: 1
      }
    }
  ];
  for (const taxonomy of medalTypeTaxonomies) {
    try {
      await taxonomiesCollection.insertOne(taxonomy);
    } catch (err) {
      await taxonomiesCollection.updateOne(
        { group: taxonomy.group, code: taxonomy.code },
        {
          $set: {
            'label.fr': taxonomy.label.fr,
            'label.en': taxonomy.label.en,
            'properties.weight': taxonomy.properties.weight
          }
        }
      );
    }
  }
}

async function deleteMedalTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Remove all taxonomies in group medalType.`);
  await taxonomiesCollection.deleteMany({
    group: 'medalType'
  });
}

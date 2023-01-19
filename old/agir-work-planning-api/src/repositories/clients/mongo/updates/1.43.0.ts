import * as MongoDb from 'mongodb';

import { RoadNetworkType, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.43.0');

/**
 * For V1.43.0 We need to add taxonomies for the road network type of projects and interventions.
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await insertNetworkTypeTaxonomies(taxonomiesCollection);
}

async function insertNetworkTypeTaxonomies(taxonomiesCollection: MongoDb.Collection): Promise<void> {
  logger.info(`Adding taxonomies for road network type`);
  const taxonomies = [
    {
      group: TaxonomyGroup.roadNetworkType,
      code: RoadNetworkType.arterial,
      label: {
        fr: 'Artériel',
        en: 'Arterial'
      }
    },
    {
      group: TaxonomyGroup.roadNetworkType,
      code: RoadNetworkType.local,
      label: {
        fr: 'Local',
        en: 'Local'
      }
    },
    {
      group: TaxonomyGroup.roadNetworkType,
      code: RoadNetworkType.arterialLocal,
      label: {
        fr: 'Artériel/Local',
        en: 'Arterial/Local'
      }
    },
    {
      group: TaxonomyGroup.roadNetworkType,
      code: RoadNetworkType.offRoadNetwork,
      label: {
        fr: 'Hors réseau routier',
        en: 'Off road network'
      }
    }
  ];
  for (const taxonomy of taxonomies) {
    try {
      await taxonomiesCollection.insertOne(taxonomy);
    } catch (e) {
      logger.error(e, `Creating group ${TaxonomyGroup.roadNetworkType} and code ${taxonomy.code} failed.`);
      return;
    }
  }
}

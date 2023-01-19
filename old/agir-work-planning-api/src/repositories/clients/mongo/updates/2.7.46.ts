import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.46');
let TAXONOMIES_COLLECTION: Collection;

/**
 * For V2.7.46 update project requirements
 */

export default async function update(db: Db): Promise<void> {
  try {
    const startTime = Date.now();

    TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

    await insertTaxonomies([getNewRoadSectionTaxonomy()]);
    await insertTaxonomies(getNewAssetDataKeyTaxonomies());

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.46 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  const insertResults = await TAXONOMIES_COLLECTION.insertMany(taxonomies);
  logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
}

function getNewRoadSectionTaxonomy(): ITaxonomy {
  return {
    group: 'assetType',
    code: 'roadSection',
    label: {
      fr: 'Tronçon',
      en: 'Road section'
    },
    properties: {
      idKey: 'id',
      namespace: 'montreal',
      owners: ['publicWorksRoad'],
      sourcesLayerId: 'road-sections',
      workTypes: ['undefined'],
      dataKeys: [
        {
          code: 'roadSectionStreetName',
          isMainAttribute: false,
          displayOrder: 1
        },
        {
          code: 'streetFrom',
          isMainAttribute: false,
          displayOrder: 2
        },
        {
          code: 'streetTo',
          isMainAttribute: false,
          displayOrder: 3
        },
        {
          code: 'roadSectionShortStreetName',
          isMainAttribute: false,
          displayOrder: 4
        },
        {
          code: 'shortStreetFrom',
          isMainAttribute: false,
          displayOrder: 5
        },
        {
          code: 'shortStreetTo',
          isMainAttribute: false,
          displayOrder: 6
        }
      ],
      consultationOnly: true
    }
  };
}

function getNewAssetDataKeyTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'assetDataKey',
      code: 'roadSectionStreetName',
      label: {
        fr: 'Voie',
        en: 'Street'
      },
      properties: {
        geomaticKey: 'name',
        assetKey: 'streetName'
      }
    },
    {
      group: 'assetDataKey',
      code: 'streetFrom',
      label: {
        fr: 'De',
        en: 'From'
      },
      properties: {
        geomaticKey: 'fromName',
        assetKey: 'streetFrom'
      }
    },
    {
      group: 'assetDataKey',
      code: 'streetTo',
      label: {
        fr: 'À',
        en: 'To'
      },
      properties: {
        geomaticKey: 'toName',
        assetKey: 'streetTo'
      }
    },
    {
      group: 'assetDataKey',
      code: 'roadSectionShortStreetName',
      label: {
        fr: 'Voie',
        en: 'Street'
      },
      properties: {
        geomaticKey: 'shortName',
        assetKey: 'shortStreetName'
      }
    },
    {
      group: 'assetDataKey',
      code: 'shortStreetFrom',
      label: {
        fr: 'De',
        en: 'From'
      },
      properties: {
        geomaticKey: 'fromShortName',
        assetKey: 'shortStreetFrom'
      }
    },
    {
      group: 'assetDataKey',
      code: 'shortStreetTo',
      label: {
        fr: 'À',
        en: 'To'
      },
      properties: {
        geomaticKey: 'toShortName',
        assetKey: 'shortStreetTo'
      }
    }
  ];
}

export const taxos2746 = [getNewRoadSectionTaxonomy(), ...getNewAssetDataKeyTaxonomies()];

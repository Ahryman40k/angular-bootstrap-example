import * as MongoDb from 'mongodb';

import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.23');

/**
 * For V2.7.23 update the assetType unifiedSection to set its namespace to secured
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await updateAssetType(taxonomiesCollection);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.23 executed in ${milliseconds} milliseconds`);
}

const UNIFIED_SECTION_ASSETTYPE: ITaxonomy[] = [
  {
    code: 'unifiedSection',
    group: 'assetType',
    label: {
      en: 'Unified sections',
      fr: 'Tronçons unifiés'
    },
    properties: {
      idKey: 'id',
      namespace: 'secured',
      owners: ['publicWorksRoad', 'mtq', 'borough'],
      sourcesLayerId: 'troncons-unifies',
      workTypes: ['undefined'],
      dataKeys: [
        {
          code: 'jmapId',
          isMainAttribute: false,
          displayOrder: 1
        },
        {
          code: 'labelMap2016',
          isMainAttribute: false,
          displayOrder: 2
        },
        {
          code: 'legendMap2016',
          isMainAttribute: false,
          displayOrder: 3
        },
        {
          code: 'boroughPi',
          isMainAttribute: false,
          displayOrder: 4
        },
        {
          code: 'size',
          isMainAttribute: true,
          displayOrder: 5
        },
        {
          code: 'hypReport',
          isMainAttribute: false,
          displayOrder: 6
        },
        {
          code: 'hypTable',
          isMainAttribute: false,
          displayOrder: 7
        },
        {
          code: 'hypMap',
          isMainAttribute: false,
          displayOrder: 8
        }
      ],
      consultationOnly: true
    }
  }
];

export const taxos2723 = getUnifiedSectionTaxonomies();

function getUnifiedSectionTaxonomies(): ITaxonomy[] {
  return UNIFIED_SECTION_ASSETTYPE;
}

async function updateAssetType(collection: MongoDb.Collection): Promise<void> {
  try {
    for (const codeValue of UNIFIED_SECTION_ASSETTYPE) {
      logger.info(`Update  ${collection.collectionName}   assetType=unifiedSection set namespace to secured`);
      const updateResult = await collection.updateOne(
        {
          group: codeValue.group,
          code: codeValue.code
        },
        {
          $set: {
            'properties.namespace': codeValue.properties.namespace
          }
        }
      );

      logger.info(
        `${updateResult.upsertedCount} documents from ${collection.collectionName} collection updated , unifiedSection properties.namespace set to secured`
      );
    }
  } catch (e) {
    logger.error(`Delete ${collection.collectionName} priority ids error -> ${e}`);
  }
}

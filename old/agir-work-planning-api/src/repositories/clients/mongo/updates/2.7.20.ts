import * as MongoDb from 'mongodb';

import { AssetType, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.20');

/**
 * For V2.7.20 update the assetType remStation to set its idKey to id instead of uuid
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await updateAssetType(taxonomiesCollection);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.20 executed in ${milliseconds} milliseconds`);
}

const REM_STATION_ASSETTYPE: ITaxonomy[] = [
  {
    code: AssetType.remStation,
    group: TaxonomyGroup.assetType,
    label: {
      fr: 'Station REM',
      en: 'REM station'
    },
    properties: {
      namespace: 'montreal',
      sourcesLayerId: 'rem-stations',
      idKey: 'id',
      consultationOnly: true,
      dataKeys: [
        {
          code: 'installationDate',
          isMainAttribute: false,
          displayOrder: 1
        }
      ],
      owners: ['mtq']
    }
  }
];

export const taxos2720 = getRemStationTaxonomies();

function getRemStationTaxonomies(): ITaxonomy[] {
  return REM_STATION_ASSETTYPE;
}

async function updateAssetType(collection: MongoDb.Collection): Promise<void> {
  try {
    for (const codeValue of REM_STATION_ASSETTYPE) {
      logger.info(`Update  ${collection.collectionName}   assetType=remStation set idKey to id`);
      const updateResult = await collection.updateOne(
        {
          group: codeValue.group,
          code: codeValue.code
        },
        {
          $set: {
            'properties.idKey': codeValue.properties.idKey
          }
        }
      );

      logger.info(
        `${updateResult.upsertedCount} documents from ${collection.collectionName} collection updated , remStation properties.idKey set to id`
      );
    }
  } catch (e) {
    logger.error(`Delete ${collection.collectionName} priority ids error -> ${e}`);
  }
}

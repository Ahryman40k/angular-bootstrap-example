import { AssetType, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.36');

/**
 * For V2.7.36 update the assetType shoppingStreet to set its idKey to id
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await updateAssetType(taxonomiesCollection);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.36 executed in ${milliseconds} milliseconds`);
}

const SHOPPING_STREET_ASSETTYPE: ITaxonomy = {
  code: AssetType.shoppingStreet,
  group: TaxonomyGroup.assetType,
  label: {
    fr: 'Rue commençante',
    en: 'Shopping street'
  },
  properties: {
    namespace: 'montreal',
    sourcesLayerId: 'rues-commercantes',
    idKey: 'id',
    consultationOnly: true,
    owners: ['borough'],
    workTypes: ['undefined']
  }
};

export const taxos2736 = getShoppingStreetTaxonomies();

function getShoppingStreetTaxonomies(): ITaxonomy[] {
  return [SHOPPING_STREET_ASSETTYPE];
}

async function updateAssetType(collection: MongoDb.Collection): Promise<void> {
  try {
    logger.info(`Update  ${collection.collectionName}   assetType=shoppingStreet set idKey to id`);
    const updateResult = await collection.updateOne(
      {
        group: SHOPPING_STREET_ASSETTYPE.group,
        code: SHOPPING_STREET_ASSETTYPE.code
      },
      {
        $set: {
          'properties.idKey': SHOPPING_STREET_ASSETTYPE.properties.idKey
        }
      }
    );

    logger.info(
      `${updateResult.upsertedCount} documents from ${collection.collectionName} collection updated , shoppingStreet properties.idKey set to id`
    );
  } catch (e) {
    logger.error(`Delete ${collection.collectionName} priority ids error -> ${e}`);
  }
}

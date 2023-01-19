import { ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';
import { isEmpty } from '../../../../utils/utils';

const logger = createLogger('mongo/2.7.29');
let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.29  insert new assetType
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await deleteOldAssetTypeTaxonomies();

  await updateShoppingStreetTaxonomies(TAXONOMIES_COLLECTION);

  const assetType = getAssetTypeTaxonomies();
  const mapAssetLogicLayer = getMapAssetLogicLayerTaxonomies();

  await upsertTaxonomies(assetType);
  await upsertTaxonomies(mapAssetLogicLayer);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.29 executed in ${milliseconds} milliseconds`);
}

/**
 * Deleting the old assetType
 *
 * @returns {Promise<void>}
 */
async function deleteOldAssetTypeTaxonomies(): Promise<void> {
  const codes = ['trafficLights'];

  const result = await TAXONOMIES_COLLECTION.deleteMany({ group: TaxonomyGroup.assetType, code: { $in: codes } });
  logger.info(`${result.deletedCount} assetType  ${codes.join()} DELETED`);
}

/**
 * Update the shoppingStreet assetType to add idKey
 *
 * @returns {Promise<void>}
 */
async function updateShoppingStreetTaxonomies(collection: Collection): Promise<void> {
  const shoppingStreetCode = 'shoppingStreet';
  const shoppingStreetIdKey = 'igds_level';

  try {
    const updateResult = await collection.updateOne(
      {
        group: TaxonomyGroup.assetType,
        code: shoppingStreetCode
      },
      {
        $set: {
          'properties.idKey': shoppingStreetIdKey
        }
      }
    );

    logger.info(`${updateResult.upsertedCount} assetType  shoppingStreet updated: IdKey added`);
  } catch (e) {
    logger.error(`Update  ${collection.collectionName} error -> ${e}`);
  }
}

async function upsertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`upsert assetType  ${TAXONOMIES_COLLECTION.collectionName}`);
  try {
    for (const taxonomy of taxonomies) {
      const setValue = {
        label: taxonomy.label
      };
      // tslint:disable:no-string-literal
      if (!isEmpty(taxonomy.properties)) {
        setValue['properties'] = taxonomy.properties;
      }
      if (!isEmpty(taxonomy.displayOrder)) {
        setValue['displayOrder'] = taxonomy.displayOrder;
      }
      await TAXONOMIES_COLLECTION.updateOne(
        { group: taxonomy.group, code: taxonomy.code },
        { $set: setValue },
        { upsert: true }
      );
    }
  } catch (e) {
    logger.error(`Create Service taxonomies error -> ${e}`);
  }
}

export const taxos2729: ITaxonomy[] = [...getAssetTypeTaxonomies(), ...getMapAssetLogicLayerTaxonomies()];

// tslint:disable-next-line: max-func-body-length
function getAssetTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'trafficLight',
      group: 'assetType',
      label: {
        fr: 'Feux de circulation int',
        en: 'Traffic light int'
      },
      properties: {
        namespace: 'secured',
        sourcesLayerId: 'feux-de-circulation',
        idKey: 'id',
        consultationOnly: true,
        dataKeys: [
          {
            code: 'installationDate',
            isMainAttribute: false,
            displayOrder: 1
          },
          {
            code: 'inspectionDate',
            isMainAttribute: false,
            displayOrder: 2
          }
        ],
        owners: ['signals'],
        workTypes: ['abandon', 'equipmentChange', 'reconstruction', 'construction']
      }
    }
  ];
}

// tslint:disable-next-line: max-func-body-length
function getMapAssetLogicLayerTaxonomies(): ITaxonomy[] {
  return [
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'waterPoint',
      displayOrder: 3260,
      label: {
        fr: "Point d'eau",
        en: 'Water point'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'shoppingStreet',
      displayOrder: 2215,
      label: {
        fr: 'Rue commençante',
        en: 'Shopping street'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'trafficLight',
      displayOrder: 3265,
      label: {
        fr: 'Feux de circulation int',
        en: 'Traffic light int'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'barrel',
      displayOrder: 3270,
      label: {
        fr: 'Fût',
        en: 'Barrel'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'cable',
      displayOrder: 3275,
      label: {
        fr: 'Câble',
        en: 'Cable'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'track',
      displayOrder: 3275,
      label: {
        fr: 'Voie ferrée',
        en: 'Track'
      }
    },
    {
      group: TaxonomyGroup.mapAssetLogicLayer,
      code: 'busShelter',
      displayOrder: 3280,
      label: {
        fr: 'Abribus',
        en: 'Bus shelter'
      }
    }
  ];
}

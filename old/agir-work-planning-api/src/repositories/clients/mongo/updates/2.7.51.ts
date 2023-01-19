import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Collection, Db } from 'mongodb';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.51');
const ASSET_TYPE = 'assetType';
const ASSET_DATA_KEY = 'assetDataKey';
const STREET_TREE = 'streetTree';
const PLANTATION_DATE = 'plantationDate';
const MAP_ASSET_LOGIC_LAYER = 'mapAssetLogicLayer';

let TAXONOMIES_COLLECTION: Collection;
/**
 * For V2.7.51  update assetType streetTree properties.sourcesLayerId and insert new mapAssetLogicLayerGroupe streetTree
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await updateAssetTypeStreetTree();
  await insertTaxonomies(getMapAssetLogicLayerTaxonomies());
  await insertTaxonomies(getAssetDataKeyTaxonomies());

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.51 executed in ${milliseconds} milliseconds`);
}

async function updateAssetTypeStreetTree(): Promise<void> {
  const streetTreeAsset = getAssetTypeTaxonomies();
  try {
    for (const assetType of streetTreeAsset) {
      logger.info(`update  group : ${assetType.group} assetType: ${assetType.code} `);
      await TAXONOMIES_COLLECTION.updateOne(
        { group: ASSET_TYPE, code: STREET_TREE },
        {
          $set: {
            'properties.sourcesLayerId': assetType.properties.sourcesLayerId
          }
        }
      );

      await TAXONOMIES_COLLECTION.updateOne(
        { group: ASSET_TYPE, code: STREET_TREE, 'properties.dataKeys.code': 'installationDate' },
        {
          $set: {
            'properties.dataKeys.$.code': PLANTATION_DATE
          }
        }
      );
    }
  } catch (e) {
    logger.error(`update assetType ERROR  -> ${e}`);
  }
}

async function insertTaxonomies(taxonomies: ITaxonomy[]): Promise<void> {
  logger.info(`Insert in taxonomies collection`);
  try {
    const insertResults = await TAXONOMIES_COLLECTION.insertMany(taxonomies);
    logger.info(`${insertResults.insertedCount} documents inserted in taxonomies collection`);
  } catch (e) {
    logger.info(`Insert taxonomies error -> ${e}`);
  }
}

export const taxos2751: ITaxonomy[] = [
  ...getMapAssetLogicLayerTaxonomies(),
  ...getAssetTypeTaxonomies(),
  ...getAssetDataKeyTaxonomies()
];

function getMapAssetLogicLayerTaxonomies(): ITaxonomy[] {
  return [
    {
      group: MAP_ASSET_LOGIC_LAYER,
      code: STREET_TREE,
      displayOrder: 4020,
      label: {
        fr: 'Arbres sur rue',
        en: 'Street trees'
      }
    }
  ];
}

function getAssetTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      group: ASSET_TYPE,
      code: STREET_TREE,
      label: {
        fr: 'Arbre sur rue',
        en: 'street Tree'
      },
      properties: {
        idKey: 'id',
        namespace: 'montreal',
        owners: ['publicWorksRoad'],
        sourcesLayerId: 'arbres-sur-rue',
        workTypes: ['construction', 'reconstruction', 'rehabilitation', 'abandon'],
        dataKeys: [
          {
            code: PLANTATION_DATE,
            isMainAttribute: false,
            displayOrder: 1
          },
          {
            code: 'inspectionDate',
            isMainAttribute: false,
            displayOrder: 2
          }
        ],
        consultationOnly: true
      }
    }
  ];
}

function getAssetDataKeyTaxonomies(): ITaxonomy[] {
  return [
    {
      group: ASSET_DATA_KEY,
      code: PLANTATION_DATE,
      label: {
        fr: 'Date de plantation',
        en: 'Plantation date'
      },
      properties: {
        geomaticKey: 'datePlantation',
        assetKey: 'plantationDate'
      }
    }
  ];
}

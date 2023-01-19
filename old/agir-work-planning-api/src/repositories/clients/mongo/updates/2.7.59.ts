import { Collection, Db } from 'mongodb';

import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.59');
let TAXONOMIES_COLLECTION: Collection;
const GROUP_ASSETTYPE = 'assetType';
const GROUP_MAPASSETLOGICLAYER = 'mapAssetLogicLayer';
const itemsToDelete = ['park', 'parks', 'lineUndercutPark', 'polygonUndercutPark', 'ecoterritory', 'wood'];

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await deleteMany(GROUP_ASSETTYPE, itemsToDelete);
  await deleteMany(GROUP_MAPASSETLOGICLAYER, itemsToDelete);

  await insertTaxonomies(getAssetTypeTaxonomies());
  await insertTaxonomies(getMapAssetLogicLayerTaxonomies());

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.59 executed in ${milliseconds} milliseconds`);
}

async function deleteMany(group: string, toDelete: string[]): Promise<void> {
  const result = await TAXONOMIES_COLLECTION.deleteMany({ group, code: { $in: toDelete } });
  logger.info(`Delete ${result.deletedCount} assetType from group ${group} : ${toDelete}`);
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

function getAssetTypeTaxonomies(): ITaxonomy[] {
  return [
    {
      code: 'greenSpace',
      group: 'assetType',
      label: {
        fr: 'Espace Vert',
        en: 'Green Space'
      },
      properties: {
        namespace: 'montreal',
        sourcesLayerId: 'espaces-verts',
        idKey: 'id',
        consultationOnly: 'true',
        owners: ['sgp'],
        workTypes: ['construction', 'reconstruction']
      }
    }
  ];
}

function getMapAssetLogicLayerTaxonomies(): ITaxonomy[] {
  return [
    {
      group: 'mapAssetLogicLayer',
      code: 'greenSpace',
      displayOrder: 3235,
      label: {
        fr: 'Espace Vert',
        en: 'Green Space'
      }
    }
  ];
}

export const taxos2759: ITaxonomy[] = [...getAssetTypeTaxonomies(), ...getMapAssetLogicLayerTaxonomies()];

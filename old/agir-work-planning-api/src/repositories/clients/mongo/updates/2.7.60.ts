import { Collection, Db } from 'mongodb';

import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.60');
let TAXONOMIES_COLLECTION: Collection;

export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);

  await updateAssetLogicLayer(getMapAssetLogicLayerTaxonomies());

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.60 executed in ${milliseconds} milliseconds`);
}

async function updateAssetLogicLayer(assetLogic: ITaxonomy): Promise<void> {
  await TAXONOMIES_COLLECTION.updateOne(
    { group: assetLogic.group, code: assetLogic.code },
    {
      $set: {
        displayOrder: assetLogic.displayOrder
      }
    }
  );
}

function getMapAssetLogicLayerTaxonomies(): ITaxonomy {
  return {
    group: 'mapAssetLogicLayer',
    code: 'greenSpace',
    displayOrder: 1500,
    label: {
      fr: 'Espace Vert',
      en: 'Green Space'
    }
  };
}

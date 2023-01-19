import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.5');
let TAXONOMIES_COLLECTION: MongoDb.Collection;

/**
 * For V2.7.5 we need to modify the taxonomy group mapAssetLogicLayer
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();

  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  await replaceTaxonomies();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.5 executed in ${milliseconds} milliseconds`);
}

async function replaceTaxonomies(): Promise<void> {
  logger.info('Replace taxonomies');
  try {
    await updateAssetLogicLayerTaxonomy('alleys', 'alley');
    await updateAssetLogicLayerTaxonomy('aqueductEntranceSegments', 'aqueductEntranceSegment');
    await updateAssetLogicLayerTaxonomy('aqueductJoins', 'aqueductJoin');
    await updateAssetLogicLayerTaxonomy('aqueductValveChambers', 'aqueductValveChamber');
    await updateAssetLogicLayerTaxonomy('aqueductValves', 'aqueductValve');
    await updateAssetLogicLayerTaxonomy('aqueducts', 'aqueductSegment');
    await updateAssetLogicLayerTaxonomy('bikePaths', 'bikePath');
    await updateAssetLogicLayerTaxonomy('csemMassives', 'csemMassive');
    await updateAssetLogicLayerTaxonomy('csemStructures', 'csemStructure');
    await updateAssetLogicLayerTaxonomy('fireHydrants', 'fireHydrant');
    await updateAssetLogicLayerTaxonomy('highways', 'highway');
    await updateAssetLogicLayerTaxonomy('parks', 'park');
    await updateAssetLogicLayerTaxonomy('revisionRoadNetworks', 'revisionRoadNetwork');
    await updateAssetLogicLayerTaxonomy('roadNetworkNodes', 'roadNetworkNode');
    await updateAssetLogicLayerTaxonomy('roadways', 'roadway');
    await updateAssetLogicLayerTaxonomy('sewerChambers', 'sewerChamber');
    await updateAssetLogicLayerTaxonomy('sewerJoins', 'sewerJoin');
    await updateAssetLogicLayerTaxonomy('sewerSumps', 'sewerSump');
    await updateAssetLogicLayerTaxonomy('sewers', 'sewerSegment');
    await updateAssetLogicLayerTaxonomy('unifiedSections', 'unifiedSection');
  } catch (e) {
    logger.error(`Replace taxonomies error -> ${e}`);
  }
}

async function updateAssetLogicLayerTaxonomy(oldCode: string, newCode: string): Promise<void> {
  await TAXONOMIES_COLLECTION.updateOne(
    { group: 'mapAssetLogicLayer', code: oldCode },
    {
      $set: { code: newCode }
    },
    { upsert: true }
  );
}

const updatedTaxonomies: ITaxonomy[] = [
  {
    code: 'alley',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'aqueductEntranceSegment',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'aqueductJoin',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'aqueductValveChamber',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'aqueductValve',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'aqueductSegment',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'bikePath',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'csemMassive',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'csemStructure',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'fireHydrant',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'highway',
    group: 'mapAssetLogicLayer'
  },
  {
    group: 'mapAssetLogicLayer',
    code: 'park'
  },
  {
    group: 'mapAssetLogicLayer',
    code: 'revisionRoadNetwork'
  },
  {
    code: 'roadNetworkNode',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'roadway',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'sewerChamber',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'sewerJoin',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'sewerSump',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'sewerSegment',
    group: 'mapAssetLogicLayer'
  },
  {
    code: 'unifiedSection',
    group: 'mapAssetLogicLayer'
  }
] as ITaxonomy[];

export const taxos275: ITaxonomy[] = updatedTaxonomies;

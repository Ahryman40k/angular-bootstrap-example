import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.5.4');

export default async function update(db: Db): Promise<void> {
  const interventionsCollection = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  await updateAssetToAnAssetsArrayInIntervention(interventionsCollection);
  await deleteAssetFromIntervention(interventionsCollection);
}

async function updateAssetToAnAssetsArrayInIntervention(interventionsCollection: Collection): Promise<void> {
  logger.info('Move the intervention asset in an assets array');
  try {
    await interventionsCollection.find().forEach(async intervention => {
      intervention.assets = [intervention.asset];
      await interventionsCollection.save(intervention);
    });
  } catch (e) {
    logger.info(`Update intervention assets field error -> ${e}`);
  }
}

async function deleteAssetFromIntervention(interventionsCollection: Collection): Promise<void> {
  logger.info('Delete the now unused intervention asset');
  try {
    await interventionsCollection.find().forEach(async intervention => {
      delete intervention.asset;
      await interventionsCollection.save(intervention);
    });
  } catch (e) {
    logger.info(`Delete intervention asset field error -> ${e}`);
  }
}

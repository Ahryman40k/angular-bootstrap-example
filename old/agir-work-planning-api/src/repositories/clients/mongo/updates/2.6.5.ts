import { Collection, Db } from 'mongodb';

import { isEmpty, omit } from 'lodash';
import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.6.5');

let TAXONOMIES_COLLECTION: Collection;
let OPPORTUNITYNOTICES_COLLECTION: Collection;
let INTERVENTIONS_COLLECTION: Collection;

export default async function update(db: Db): Promise<void> {
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  OPPORTUNITYNOTICES_COLLECTION = db.collection(constants.mongo.collectionNames.OPPORTUNITY_NOTICES);
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  try {
    await updateTaxonomies();
    const allCodes: string[] = CODE_AND_VALUE.map(cv => cv.code);
    await deleteOpportunityNotices(allCodes);
    await setAssetIdInterventionToNull(allCodes);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

const GROUP = 'assetType';
const FIELD_PATH = 'properties.idKey';
const CODE_AND_VALUE = [
  {
    code: 'sewerManhole',
    value: 'noGeomatiqueRegard'
  },
  {
    code: 'sewerChamber',
    value: 'noGeomatiqueChambre'
  },
  {
    code: 'aqueductValve',
    value: 'noGeomatiqueVanne'
  },
  {
    code: 'sewerSegment',
    value: 'noGeomatiqueSegment'
  },
  {
    code: 'sewerJoin',
    value: 'noGeomatiqueRaccord'
  },
  {
    code: 'aqueductJoin',
    value: 'noGeomatiqueRaccord'
  },
  {
    code: 'aqueductSegment',
    value: 'noGeomatiqueSegment'
  },
  {
    code: 'aqueductValveChamber',
    value: 'noGeomatiqueChambre'
  },
  {
    code: 'aqueductEntranceSegment',
    value: 'noGeomatiqueSegment'
  },
  {
    code: 'sewerSump',
    value: 'noGeomatiquePuisard'
  }
];

async function updateTaxonomies(): Promise<void> {
  logger.info('UPDATE TAXONOMIES STARTED');
  for (const codeAndValue of CODE_AND_VALUE) {
    logger.info(`Updating ${GROUP} with code ${codeAndValue.code}`);
    await TAXONOMIES_COLLECTION.updateOne(
      { group: GROUP, code: codeAndValue.code },
      {
        $set: {
          [FIELD_PATH]: codeAndValue.value
        }
      }
    );
  }
  logger.info('UPDATE TAXONOMIES DONE');
}

async function deleteOpportunityNotices(allCodes: string[]): Promise<void> {
  logger.info('DELETE OPPORTUNITIES NOTICES STARTED');
  const result = await OPPORTUNITYNOTICES_COLLECTION.deleteMany({
    'assets.typeId': { $in: allCodes }
  });
  logger.info(`DELETE OPPORTUNITIES NOTICES DONE - ${result.deletedCount}`);
}

async function setAssetIdInterventionToNull(allCodes: string[]): Promise<void> {
  logger.info('ASSET ID NULL STARTED');
  const interventions = await INTERVENTIONS_COLLECTION.find({
    'assets.typeId': { $in: allCodes }
  }).toArray();
  await Promise.all(
    interventions.map(async intervention => {
      if (!isEmpty(intervention.assets)) {
        intervention.assets = intervention.assets.map((asset: any) => omit(asset, 'id'));
        await INTERVENTIONS_COLLECTION.updateOne(
          {
            _id: intervention._id
          },
          {
            $set: {
              assets: intervention.assets
            }
          }
        );
      }
    })
  );
  logger.info(`ASSET ID NULL DONE`);
}

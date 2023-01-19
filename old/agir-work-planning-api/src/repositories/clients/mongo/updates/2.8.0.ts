import { isEmpty, isNil } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.8.0`;
const logger = createLogger(`mongo/${VERSION}`);

const GROUP_ASSET_TYPE = 'assetType';
const BAD_CODE_VALVE_CHAMBER = 'valveChamber';
const CODE_AQUEDUCT_VALVE_CHAMBER = 'aqueductValveChamber';
const BAD_CODE_BICYCLE = 'bicycleAmenagement';
const CODE_BIKE_PATH = 'bikePath';

let TAXONOMIES_COLLECTION: Collection;
let INTERVENTIONS_COLLECTION: Collection;
let OPPORTUNITY_COLLECTION: Collection;
let PROGRAM_BOOKS_COLLECITON: Collection;

/**
 * For V2.8.0 delete duplicate valveChamber  and bicycleAmenagement
 * and update interventions, opportunity and programBook  and programBook.objectives accordingly
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();

  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  OPPORTUNITY_COLLECTION = db.collection(constants.mongo.collectionNames.OPPORTUNITY_NOTICES);
  PROGRAM_BOOKS_COLLECITON = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);

  await TAXONOMIES_COLLECTION.deleteMany({
    group: GROUP_ASSET_TYPE,
    code: { $in: [BAD_CODE_BICYCLE, BAD_CODE_VALVE_CHAMBER] }
  });

  await migrateData(GROUP_ASSET_TYPE, CODE_AQUEDUCT_VALVE_CHAMBER, BAD_CODE_VALVE_CHAMBER);
  await assertResults(CODE_AQUEDUCT_VALVE_CHAMBER, BAD_CODE_VALVE_CHAMBER);

  await migrateData(GROUP_ASSET_TYPE, CODE_BIKE_PATH, BAD_CODE_BICYCLE);
  await assertResults(CODE_BIKE_PATH, BAD_CODE_BICYCLE);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function migrateData(groupAssetType: string, goodCodeAssetType: string, badCodeAssetType: string): Promise<void> {
  const taxo = await TAXONOMIES_COLLECTION.findOne({
    group: groupAssetType,
    code: goodCodeAssetType
  });

  // We get the first owner !!!
  const owner = taxo?.properties?.owners?.find((e: string) => e);

  let result: any;

  if (isNil(owner)) {
    throw new Error(`${goodCodeAssetType} owner is null/undefined`);
  }

  // Migrate typeId and ownerId in interventions
  result = await INTERVENTIONS_COLLECTION.updateMany(
    { 'assets.typeId': badCodeAssetType },
    {
      $set: {
        'assets.$[elem].typeId': goodCodeAssetType,
        'assets.$[elem].ownerId': owner
      }
    },
    { arrayFilters: [{ 'elem.typeId': badCodeAssetType }] }
  );
  logger.info(
    `update interventions:   found  ${result.matchedCount} interventions with bad typeId=${badCodeAssetType},  successfully updated  ${result.modifiedCount} interventions`
  );

  // Migrate typeId and ownerId in opportunity Notice
  result = await OPPORTUNITY_COLLECTION.updateMany(
    { 'assets.typeId': badCodeAssetType },
    {
      $set: {
        'assets.$[elem].typeId': goodCodeAssetType,
        'assets.$[elem].ownerId': owner
      }
    },
    { arrayFilters: [{ 'elem.typeId': badCodeAssetType }] }
  );
  logger.info(
    `update opportunity Notice:   found ${result.matchedCount}  opportunity Notice with bad typeId=${badCodeAssetType},  successfully updated  ${result.modifiedCount}  opportunity Notice`
  );

  // Migrate assetTypeId  of priorityLevel    in programBooks
  result = await PROGRAM_BOOKS_COLLECITON.updateMany(
    { 'priorityScenarios.priorityLevels.criteria.assetTypeId': badCodeAssetType },
    {
      $set: {
        'priorityScenarios.0.priorityLevels.$[priorityIdx].criteria.assetTypeId.$[assetIdx]': goodCodeAssetType
      }
    },
    {
      arrayFilters: [{ 'priorityIdx.criteria.assetTypeId': badCodeAssetType }, { assetIdx: badCodeAssetType }]
    }
  );
  logger.info(
    `update programBooks priorityLevel:   found ${result.matchedCount}  programBooks with bad assetTypeId=${badCodeAssetType},  successfully updated  ${result.modifiedCount}  programBooks priorityLevel`
  );

  // Migrate assetTypeId  of objectives    in programBooks
  result = await PROGRAM_BOOKS_COLLECITON.updateMany(
    { 'objectives.assetTypeIds': badCodeAssetType },
    {
      $set: {
        'objectives.$[objectivesIdx].assetTypeIds.$[assetIdx]': goodCodeAssetType
      }
    },
    {
      arrayFilters: [{ 'objectivesIdx.assetTypeIds': badCodeAssetType }, { assetIdx: badCodeAssetType }]
    }
  );
  logger.info(
    `update programBooks objectives:   found ${result.matchedCount}  programBooks with objectives bad  assetTypeId=${badCodeAssetType},  successfully updated  ${result.modifiedCount}  programBooks objectives`
  );
}

async function assertResults(goodCodeAssetType: string, badCodeAssetType: string): Promise<void> {
  const resultIntervention = await INTERVENTIONS_COLLECTION.find({ 'assets.typeId': badCodeAssetType }).toArray();
  const resultOpportunity = await OPPORTUNITY_COLLECTION.find({ 'assets.typeId': badCodeAssetType }).toArray();

  const resultObjective = await PROGRAM_BOOKS_COLLECITON.find({
    'objectives.assetTypeIds': badCodeAssetType
  }).toArray();

  const resultPriority = await PROGRAM_BOOKS_COLLECITON.find({
    'priorityScenarios.priorityLevels.criteria.assetTypeId': badCodeAssetType
  }).toArray();

  if (
    !isEmpty(resultIntervention) &&
    !isEmpty(resultOpportunity) &&
    !isEmpty(resultObjective) &&
    !isEmpty(resultPriority)
  ) {
    throw new Error(`Migration failed to change ${badCodeAssetType} to ${goodCodeAssetType}`);
  } else {
    logger.info(`Migration successfull,  no bad assetTypeId left :  ${badCodeAssetType}`);
  }
}

import { isEmpty, isNil } from 'lodash';
import { Collection, Db } from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const VERSION = `2.7.71`;
const logger = createLogger(`mongo/${VERSION}`);

const GROUP_ASSET_TYPE = 'assetType';
const BAD_CODE_CHUTE_EGOUT = 'chuteEgout';
const CODE_SEWER_DROP = 'sewerDrop';

const SEWER_DROP_DATA_KEYS = [
  {
    code: 'jmapId',
    isMainAttribute: false,
    displayOrder: 1
  },
  {
    code: 'objectId',
    isMainAttribute: false,
    displayOrder: 2
  },
  {
    code: 'placeName',
    isMainAttribute: true,
    displayOrder: 3
  },
  {
    code: 'snowId',
    isMainAttribute: false,
    displayOrder: 4
  },
  {
    code: 'descPlace',
    isMainAttribute: false,
    displayOrder: 5
  },
  {
    code: 'streetName',
    isMainAttribute: false,
    displayOrder: 6
  },
  {
    code: 'fullAddress',
    isMainAttribute: false,
    displayOrder: 7
  },
  {
    code: 'pointX',
    isMainAttribute: false,
    displayOrder: 8
  },
  {
    code: 'pointY',
    isMainAttribute: false,
    displayOrder: 9
  },
  {
    code: 'municipalityName',
    isMainAttribute: false,
    displayOrder: 10
  },
  {
    code: 'aliasName',
    isMainAttribute: false,
    displayOrder: 11
  }
];

let TAXONOMIES_COLLECTION: Collection;
let INTERVENTIONS_COLLECTION: Collection;
let OPPORTUNITY_COLLECITON: Collection;
let PROGRAM_BOOKS_COLLECITON: Collection;

/**
 * For V2.7.69 delete duplicate chuteEgout and update the existing one sewerDrop
 * and update interventions, opportunity and programBook accordingly
 */
export default async function update(db: Db): Promise<void> {
  const startTime = Date.now();
  const milliseconds = Date.now() - startTime;
  TAXONOMIES_COLLECTION = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  INTERVENTIONS_COLLECTION = db.collection(constants.mongo.collectionNames.INTERVENTIONS);
  OPPORTUNITY_COLLECITON = db.collection(constants.mongo.collectionNames.OPPORTUNITY_NOTICES);
  PROGRAM_BOOKS_COLLECITON = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);

  await TAXONOMIES_COLLECTION.deleteOne({ group: GROUP_ASSET_TYPE, code: BAD_CODE_CHUTE_EGOUT });
  await updateTaxoSewerDrop();
  await migrateData();
  await assertResults();

  logger.info(`Script ${VERSION} executed in ${milliseconds} milliseconds`);
}

async function updateTaxoSewerDrop(): Promise<void> {
  await TAXONOMIES_COLLECTION.updateOne(
    { group: GROUP_ASSET_TYPE, code: CODE_SEWER_DROP },
    {
      $set: {
        'properties.dataKeys': SEWER_DROP_DATA_KEYS
      }
    }
  );
}

async function migrateData(): Promise<void> {
  const sewerDropTaxo = await TAXONOMIES_COLLECTION.findOne({ group: GROUP_ASSET_TYPE, code: CODE_SEWER_DROP });

  // We get the first owner !!!
  const sewerDropOwner = sewerDropTaxo?.properties?.owners?.find((e: string) => e);

  let result: any;

  if (isNil(sewerDropOwner)) {
    throw new Error(`${CODE_SEWER_DROP} owner is null/undefined`);
  }

  // Migrate typeId and ownerId in interventions
  result = await INTERVENTIONS_COLLECTION.updateMany(
    { 'assets.typeId': BAD_CODE_CHUTE_EGOUT },
    {
      $set: {
        'assets.$[elem].typeId': CODE_SEWER_DROP,
        'assets.$[elem].ownerId': sewerDropOwner
      }
    },
    { arrayFilters: [{ 'elem.typeId': BAD_CODE_CHUTE_EGOUT }] }
  );
  logger.info(
    `update interventions:   found  ${result.matchedCount} interventions with typeId=${BAD_CODE_CHUTE_EGOUT},  successfully updated  ${result.modifiedCount} interventions`
  );

  // Migrate typeId and ownerId in opportunity Notice
  result = await OPPORTUNITY_COLLECITON.updateMany(
    { 'assets.typeId': BAD_CODE_CHUTE_EGOUT },
    {
      $set: {
        'assets.$[elem].typeId': CODE_SEWER_DROP,
        'assets.$[elem].ownerId': sewerDropOwner
      }
    },
    { arrayFilters: [{ 'elem.typeId': BAD_CODE_CHUTE_EGOUT }] }
  );
  logger.info(
    `update opportunity Notice:   found ${result.matchedCount}  opportunity Notice with typeId=${BAD_CODE_CHUTE_EGOUT},  successfully updated  ${result.modifiedCount}  opportunity Notice`
  );

  // Migrate assetTypeId  of priorityLevel    in programBooks
  result = await PROGRAM_BOOKS_COLLECITON.updateMany(
    { 'priorityScenarios.priorityLevels.criteria.assetTypeId': BAD_CODE_CHUTE_EGOUT },
    {
      $set: {
        'priorityScenarios.0.priorityLevels.$[priorityIdx].criteria.assetTypeId.$[assetIdx]': CODE_SEWER_DROP
      }
    },
    {
      arrayFilters: [{ 'priorityIdx.criteria.assetTypeId': BAD_CODE_CHUTE_EGOUT }, { assetIdx: BAD_CODE_CHUTE_EGOUT }]
    }
  );
  logger.info(
    `update programBooks priorityLevel:   found ${result.matchedCount}  programBooks with assetTypeId=${BAD_CODE_CHUTE_EGOUT},  successfully updated  ${result.modifiedCount}  programBooks priorityLevel`
  );

  // Migrate assetTypeId  of objectives    in programBooks
  result = await PROGRAM_BOOKS_COLLECITON.updateMany(
    { 'objectives.assetTypeIds': BAD_CODE_CHUTE_EGOUT },
    {
      $set: {
        'objectives.$[objectivesIdx].assetTypeIds.$[assetIdx]': CODE_SEWER_DROP
      }
    },
    {
      arrayFilters: [{ 'objectivesIdx.assetTypeIds': BAD_CODE_CHUTE_EGOUT }, { assetIdx: BAD_CODE_CHUTE_EGOUT }]
    }
  );
  logger.info(
    `update programBooks objectives:   found ${result.matchedCount}  programBooks with objectives assetTypeId=${BAD_CODE_CHUTE_EGOUT},  successfully updated  ${result.modifiedCount}  programBooks objectives`
  );
}

async function assertResults(): Promise<void> {
  const resultIntervention = await INTERVENTIONS_COLLECTION.find({ 'assets.typeId': BAD_CODE_CHUTE_EGOUT }).toArray();
  const resultOpportunity = await OPPORTUNITY_COLLECITON.find({ 'assets.typeId': BAD_CODE_CHUTE_EGOUT }).toArray();

  const resultObjective = await PROGRAM_BOOKS_COLLECITON.find({
    'objectives.assetTypeIds': BAD_CODE_CHUTE_EGOUT
  }).toArray();
  const resultPriority = await PROGRAM_BOOKS_COLLECITON.find({
    'priorityScenarios.priorityLevels.criteria.assetTypeId': BAD_CODE_CHUTE_EGOUT
  }).toArray();

  if (
    !isEmpty(resultIntervention) &&
    !isEmpty(resultOpportunity) &&
    !isEmpty(resultObjective) &&
    !isEmpty(resultPriority)
  ) {
    throw new Error(`Migration failed to change ${BAD_CODE_CHUTE_EGOUT} to ${CODE_SEWER_DROP}`);
  } else {
    logger.info(`Migration successfull,  no bad assetTypeId left :  ${BAD_CODE_CHUTE_EGOUT}`);
  }
}

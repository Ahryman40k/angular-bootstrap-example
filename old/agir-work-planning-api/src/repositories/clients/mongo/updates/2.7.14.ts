import { ITaxonomy, ProgramBookPriorityLevelSort } from '@villemontreal/agir-work-planning-lib/dist/src';
import { chunk } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IProgramBookMongoAttributes } from '../../../../features/programBooks/mongo/programBookSchema';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.14');

/**
 * For V2.7.14 we need to update the taxonomy group roadNetworkType and add priority level sort criterias
 */

let PROGRAM_BOOKS_COLLECTION: MongoDb.Collection;
let programBooks: IProgramBookMongoAttributes[];

const DEFAULT_PRIORITY_LEVEL_SORT_CRITERIAS = [
  {
    name: ProgramBookPriorityLevelSort.NUMBER_OF_INTERVENTIONS_PER_PROJECT,
    rank: 1
  },
  {
    name: ProgramBookPriorityLevelSort.NUMBER_OF_CONTRIBUTIONS_TO_THRESHOLD,
    rank: 2
  },
  {
    name: ProgramBookPriorityLevelSort.ROAD_NETWORK_TYPE,
    rank: 3
  },
  {
    name: ProgramBookPriorityLevelSort.PROJECT_BUDGET,
    rank: 4
  },
  {
    name: ProgramBookPriorityLevelSort.PROJECT_ID,
    rank: 5
  }
];

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();
    await updateTaxonomies(db);
    await getProgramBooks(db);
    await updateProgramBooks(db);
    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.14 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}

const GROUP = 'roadNetworkType';
const FIELD_PATH = 'displayOrder';
const CODE_AND_VALUE = [
  {
    code: 'arterial',
    displayOrder: 1,
    label: {
      fr: 'Artériel',
      en: 'Arterial'
    },
    properties: {
      nexoMatches: [
        {
          code: '1',
          description: 'Artériel'
        }
      ]
    }
  },
  {
    code: 'arterial/local',
    displayOrder: 2,
    label: {
      fr: 'Artériel/Local',
      en: 'Arterial/Local'
    }
  },
  {
    code: 'local',
    displayOrder: 3,
    label: {
      fr: 'Local',
      en: 'Local'
    },
    properties: {
      nexoMatches: [
        {
          code: '0',
          description: 'Local'
        }
      ]
    }
  },
  {
    code: 'offRoadNetwork',
    displayOrder: 4,
    label: {
      fr: 'Hors réseau routier',
      en: 'Off road network'
    }
  }
] as ITaxonomy[];

export const taxos2714 = getRoadNetworkTypeTaxonomies();

function getRoadNetworkTypeTaxonomies(): ITaxonomy[] {
  return CODE_AND_VALUE.map(item => {
    return {
      code: item.code,
      group: GROUP,
      displayOrder: item.displayOrder,
      label: item.label,
      properties: item?.properties
    };
  });
}

async function updateTaxonomies(db: MongoDb.Db): Promise<void> {
  const taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
  for (const codeAndValue of CODE_AND_VALUE) {
    await taxonomiesCollection.updateOne(
      { group: GROUP, code: codeAndValue.code },
      {
        $set: {
          [FIELD_PATH]: codeAndValue.displayOrder
        }
      }
    );
  }
}

async function getProgramBooks(db: MongoDb.Db): Promise<void> {
  PROGRAM_BOOKS_COLLECTION = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  programBooks = await PROGRAM_BOOKS_COLLECTION.find({}).toArray();
}

async function updateProgramBooks(db: MongoDb.Db): Promise<void> {
  const programBooksCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  programBooks = await programBooksCollection.find({}).toArray();
  const promises = getUpdateProgramBookPromises();
  for (const chunkedPromises of chunk(promises, 10)) {
    try {
      await Promise.all(chunkedPromises);
    } catch (e) {
      logger.error(`Update program books error -> ${e}`);
    }
  }
}

function getUpdateProgramBookPromises(): Promise<void>[] {
  return programBooks.map(async programBook => {
    updatePriorityLevel(programBook);
    return updateProgramBook(programBook);
  });
}

function updatePriorityLevel(programBook: IProgramBookMongoAttributes): void {
  programBook.priorityScenarios[0].priorityLevels.map(priorityLevel => {
    priorityLevel.sortCriterias = DEFAULT_PRIORITY_LEVEL_SORT_CRITERIAS;
    return priorityLevel;
  });
}

async function updateProgramBook(programBook: IProgramBookMongoAttributes): Promise<void> {
  await PROGRAM_BOOKS_COLLECTION.updateOne(
    {
      _id: programBook._id
    },
    {
      $set: {
        priorityScenarios: programBook.priorityScenarios
      }
    },
    { upsert: true }
  );
}

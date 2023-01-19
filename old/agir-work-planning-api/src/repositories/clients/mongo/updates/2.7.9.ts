import { chunk, isEmpty } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IPriorityLevelCriteriaMongoAttributes } from '../../../../features/priorityScenarios/mongo/priorityLevelCriteriaSchema';
import { IProgramBookMongoAttributes } from '../../../../features/programBooks/mongo/programBookSchema';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.9');
let PROGRAM_BOOKS_COLLECTION: MongoDb.Collection;
let programBooks: IProgramBookMongoAttributes[];

/**
 * For V2.7.9 we need to modify the program book priority level criteria projectCategory
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  await getProgramBooks(db);
  await updateProgramBooks();
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.9 executed in ${milliseconds} milliseconds`);
}

async function getProgramBooks(db: MongoDb.Db): Promise<void> {
  PROGRAM_BOOKS_COLLECTION = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  programBooks = await PROGRAM_BOOKS_COLLECTION.find({}).toArray();
}

async function updateProgramBooks(): Promise<void> {
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
  programBook.priorityScenarios[0].priorityLevels.map(priorityLevel =>
    replaceCriteriaProjectCategory(priorityLevel.criteria)
  );
}

function replaceCriteriaProjectCategory(criteria: IPriorityLevelCriteriaMongoAttributes): void {
  if (isEmpty(criteria.projectCategory)) return;
  criteria.projectCategory = criteria.projectCategory.map((projectCategory: any) => ({
    category: projectCategory,
    subCategory: null
  }));
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

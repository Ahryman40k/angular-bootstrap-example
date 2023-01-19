import { isNil } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IProjectCategoryCriteriaMongoAttributes } from '../../../../features/priorityScenarios/mongo/projectCategoryCriteriaSchema';
import { IProgramBookMongoAttributes } from '../../../../features/programBooks/mongo/programBookSchema';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.27');
let PROGRAM_BOOKS_COLLECTION: MongoDb.Collection;

interface IProgramBookUpdate {
  update: boolean;
  programBook: IProgramBookMongoAttributes;
}
/**
 * For V2.7.27 we need to modify the program book priority level criteria projectCategory as old data are an object when it should be a string
 */
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  PROGRAM_BOOKS_COLLECTION = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  const invalidProgramBooks = await getProgramBooks();
  logger.info(`Script 2.7.27 there are ${invalidProgramBooks.length} programBooks to potentially update`);
  const fixedProgramBooks = fixProgramBooks(invalidProgramBooks);
  let nbRowsUpdated = 0;
  for (const pb of fixedProgramBooks) {
    await updateProgramBook(pb);
    nbRowsUpdated++;
  }
  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.27 updated ${nbRowsUpdated} programBooks`);
  logger.info(`Script 2.7.27 executed in ${milliseconds} milliseconds`);
}

// Get all programBooks that have an invalid
async function getProgramBooks(): Promise<IProgramBookUpdate[]> {
  const foundProgramBooks = (await PROGRAM_BOOKS_COLLECTION.find({
    $or: [
      {
        'priorityScenarios.priorityLevels.criteria.projectCategory.category': {
          $nin: ['completing', 'new', 'postponed']
        }
      },
      {
        'priorityScenarios.priorityLevels.criteria.projectCategory.category._id': { $exists: true, $not: { $size: 0 } }
      }
    ]
  }).toArray()) as IProgramBookMongoAttributes[];
  return foundProgramBooks.map(pb => {
    return {
      update: false,
      programBook: pb
    };
  });
}

function fixProgramBooks(invalidProgramBooks: IProgramBookUpdate[]): IProgramBookMongoAttributes[] {
  const fixedProgramBooksUpdate = invalidProgramBooks.map(pb => {
    pb.programBook.priorityScenarios = pb.programBook.priorityScenarios.map(scenario => {
      scenario.priorityLevels = scenario.priorityLevels.map(level => {
        if (level.criteria?.projectCategory) {
          level.criteria.projectCategory = level.criteria.projectCategory.map(projectCategory => {
            // if there is a projectCategory => update
            pb.update = true;
            let fixedProjectCategory: IProjectCategoryCriteriaMongoAttributes = {
              category: null,
              subCategory: null
            };
            if (typeof projectCategory === 'string') {
              fixedProjectCategory.category = projectCategory;
            }
            // tslint:disable:no-string-literal
            else if (projectCategory.category !== null && typeof projectCategory.category === 'object') {
              fixedProjectCategory = {
                category: projectCategory.category,
                subCategory: projectCategory.subCategory
              };
              if (!isNil(fixedProjectCategory.category['category'])) {
                fixedProjectCategory.category = fixedProjectCategory.category['category'];
                fixedProjectCategory.subCategory = fixedProjectCategory.category['subCategory'];
              }
              // Try to get the subCategory from upper level if still null
              if (isNil(fixedProjectCategory.subCategory)) {
                fixedProjectCategory.subCategory = projectCategory.subCategory;
              }
            }
            return fixedProjectCategory;
          });
        }
        return level;
      });
      return scenario;
    });
    return pb;
  });
  return fixedProgramBooksUpdate.filter(pbu => pbu.update).map(pbu => pbu.programBook);
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
    { upsert: false }
  );
}

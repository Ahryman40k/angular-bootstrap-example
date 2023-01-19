import { ProgramBookStatus, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.44');

/**
 * For V2.7.44 we need to update annualPrograms statuses
 */

let taxonomiesCollection: MongoDb.Collection;
let programBooksCollection: MongoDb.Collection;

const programBooksStatusToDelete = ['validated', 'opened', 'inDesign', 'done', 'archived', 'inProgress'];

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();

    taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
    programBooksCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);

    await deleteProgramBookStatusTaxonomies();
    await updateProgramBooks();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.44 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}
async function deleteProgramBookStatusTaxonomies(): Promise<void> {
  await taxonomiesCollection.deleteMany({
    group: TaxonomyGroup.programBookStatus,
    code: { $in: programBooksStatusToDelete }
  });
}

async function updateProgramBooks(): Promise<void> {
  await programBooksCollection.updateMany(
    { status: { $in: ['validated', 'opened'] } },
    {
      $set: {
        status: ProgramBookStatus.programming
      }
    }
  );

  await programBooksCollection.updateMany(
    { status: { $in: ['inDesign', 'done', 'archived', 'inProgress'] } },
    {
      $set: {
        status: ProgramBookStatus.submittedFinal
      }
    }
  );
}

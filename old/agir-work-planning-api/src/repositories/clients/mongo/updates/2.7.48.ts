import { AnnualProgramStatus, ProgramBookStatus, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { uniq } from 'lodash';
import * as mongoose from 'mongoose';
import { constants } from '../../../../../config/constants';
import { IAnnualProgramMongoAttributes } from '../../../../features/annualPrograms/mongo/annualProgramSchema';
import { IProgramBookMongoDocument } from '../../../../features/programBooks/mongo/programBookModel';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.48');

/**
 * For V2.7.48 we need to update annualPrograms statuses
 */

let taxonomiesCollection: MongoDb.Collection;
let annualProgramsCollection: MongoDb.Collection;
let programBooksCollection: MongoDb.Collection;

const ANNUAL_PROGRAM_STATUS_TO_DELETE = [
  'opened',
  'validated',
  'submittedPreliminary',
  'inDesign',
  'inProgress',
  'done',
  'archived'
];

export default async function update(db: MongoDb.Db): Promise<void> {
  try {
    const startTime = Date.now();

    taxonomiesCollection = db.collection(constants.mongo.collectionNames.TAXONOMIES);
    annualProgramsCollection = db.collection(constants.mongo.collectionNames.ANNUAL_PROGRAMS);
    programBooksCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);

    await deleteAnnualProgramStatusTaxonomies();
    await updateAnnualPrograms();

    const milliseconds = Date.now() - startTime;
    logger.info(`Script 2.7.48 executed in ${milliseconds} milliseconds`);
  } catch (e) {
    logger.error('Error', `${e}`);
  }
}
async function deleteAnnualProgramStatusTaxonomies(): Promise<void> {
  await taxonomiesCollection.deleteMany({
    group: TaxonomyGroup.annualProgramStatus,
    code: { $in: ANNUAL_PROGRAM_STATUS_TO_DELETE }
  });
}

async function updateAnnualPrograms(): Promise<void> {
  const annualPrograms = (await annualProgramsCollection
    .find({ status: { $in: ANNUAL_PROGRAM_STATUS_TO_DELETE } })
    .toArray()) as IAnnualProgramMongoAttributes[];
  // compute status according to program books statuses
  for (const annualProgram of annualPrograms) {
    const programBooks = (await programBooksCollection
      .find({ annualProgramId: { $in: [mongoose.Types.ObjectId(annualProgram._id)] } })
      .toArray()) as IProgramBookMongoDocument[];
    const statuses = uniq(programBooks.map(pb => pb.status));
    let annualProgramStatus = AnnualProgramStatus.new;
    // all program books are in final status => submittedFinal
    if (statuses.length === 1 && statuses[0] === ProgramBookStatus.submittedFinal) {
      annualProgramStatus = AnnualProgramStatus.submittedFinal;
    } else {
      const programmingStatuses = [
        ProgramBookStatus.programming,
        ProgramBookStatus.submittedPreliminary,
        ProgramBookStatus.submittedFinal
      ];
      if (statuses.some(status => programmingStatuses.includes(status))) {
        annualProgramStatus = AnnualProgramStatus.programming;
      }
    }

    await annualProgramsCollection.updateOne(
      { _id: mongoose.Types.ObjectId(annualProgram._id) },
      {
        $set: {
          status: annualProgramStatus
        }
      }
    );
  }
}

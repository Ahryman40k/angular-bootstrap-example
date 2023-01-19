import { AnnualProgramStatus, ProgramBookStatus } from '@villemontreal/agir-work-planning-lib';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/1.39.0');
/**
 * For V1.39.0 we need to upgrade program books and annual status to programmed
 * when they already contains projects
 */

let programBookCollection: MongoDb.Collection<any> = null;
let annualProgramCollection: MongoDb.Collection<any> = null;
let historicalsCollection: MongoDb.Collection<any> = null;
const programBooksFailed: string[] = [];
const annualProgramsFailed: string[] = [];

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  programBookCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  annualProgramCollection = db.collection(constants.mongo.collectionNames.ANNUAL_PROGRAMS);
  historicalsCollection = db.collection('historicals');

  const programBooks = await getProgramBooks();
  if (!programBooks?.length) {
    logger.info(` > No program book have been found.`);
    return;
  }

  const annualProgramIds = programBooks.map(programBook => programBook.annualProgramId);
  const annualPrograms = await getAnnualProgramsByIds(annualProgramIds);
  if (!annualPrograms?.length) {
    logger.info(` > No annual program have been found.`);
    return;
  }

  await persistProgramBooks(programBooks);
  await persistAnnualPrograms(annualPrograms);

  const endTime = Date.now();
  const seconds = (endTime - startTime) / 1000;

  logger.info(`Migration finished in ${seconds} seconds`);

  if (programBooksFailed.length) {
    logger.error({}, `Those program books are not persisted : ${programBooksFailed.join(', ')} `);
  }
  if (annualProgramsFailed.length) {
    logger.error({}, `Those annual programs are not persisted : ${annualProgramsFailed.join(', ')} `);
  }
}

async function getProgramBooks(): Promise<any[]> {
  return programBookCollection
    .aggregate([
      {
        $lookup: {
          from: constants.mongo.collectionNames.PROJECTS,
          localField: '_id',
          foreignField: 'programBookId',
          as: 'projects'
        }
      },
      { $unwind: { path: '$projects', preserveNullAndEmptyArrays: false } },
      { $project: { projects: 0 } }
    ])
    .toArray();
}

async function getAnnualProgramsByIds(annualProgramIds: string[]): Promise<any[]> {
  return annualProgramCollection
    .find({
      _id: { $in: annualProgramIds }
    })
    .toArray();
}

async function persistProgramBooks(programBooks: any[]): Promise<void> {
  const denominator = programBooks.length;
  let i = 0;
  for (const programBook of programBooks) {
    const date = new Date();
    const dateIso = date.toISOString();
    i += await persistProgramBook(programBook, dateIso);
    await persistProgramBookHistory(programBook, dateIso);
    logger.info(`${i} of ${denominator} program book persisted`);
  }
}

async function persistProgramBook(programBook: any, dateIso: string): Promise<number> {
  logger.info(`Persisting program book : ${programBook._id}.`);
  try {
    await programBookCollection.update(
      { _id: programBook._id },
      {
        $set: {
          status: ProgramBookStatus.programming,
          audit: {
            createdAt: programBook.audit.createdAt,
            createdBy: programBook.audit.createdBy,
            lastModifiedAt: dateIso,
            lastModifiedBy: 'System'
          }
        }
      }
    );
  } catch (e) {
    programBooksFailed.push(programBook._id);
    logger.error(e, `Persisting program book failed : ${programBook._id}.`);
    return 0;
  }
  logger.info(`Persisted program book : ${programBook._id}.`);
  return 1;
}

async function persistProgramBookHistory(programBook: any, dateIso: string) {
  logger.info(`Persisting program book history : ${programBook._id}.`);
  const historicalEntity = buildHistoricalEntity(
    constants.mongo.collectionNames.PROGRAM_BOOKS,
    programBook._id,
    dateIso,
    ProgramBookStatus.programming
  );
  try {
    await historicalsCollection.insert(historicalEntity);
  } catch (e) {
    logger.error(e, `Persisting program book history failed : ${programBook._id}.`);
    return;
  }
  logger.info(`Persisted program book history : ${programBook._id}.`);
}

async function persistAnnualPrograms(annualPrograms: any[]): Promise<void> {
  const denominator = annualPrograms.length;
  let i = 0;
  for (const annualProgram of annualPrograms) {
    const date = new Date();
    const dateIso = date.toISOString();
    i += await persistAnnualProgram(annualProgram, dateIso);
    await persistAnnualProgramHistory(annualProgram, dateIso);
    logger.info(`${i} of ${denominator} annual program persisted`);
  }
}

async function persistAnnualProgram(annualProgram: any, dateIso: string): Promise<number> {
  logger.info(`Persisting annual program : ${annualProgram._id}.`);
  try {
    await annualProgramCollection.update(
      { _id: annualProgram._id },
      {
        $set: {
          status: AnnualProgramStatus.programming,
          audit: {
            createdAt: annualProgram.audit.createdAt,
            createdBy: annualProgram.audit.createdBy,
            lastModifiedAt: dateIso,
            lastModifiedBy: 'System'
          }
        }
      }
    );
  } catch (e) {
    annualProgramsFailed.push(annualProgram._id);
    logger.error(e, `Persisting annual program failed : ${annualProgram._id}.`);
    return 0;
  }
  logger.info(`Persisted annual program : ${annualProgram._id}.`);
  return 1;
}

async function persistAnnualProgramHistory(annualProgram: any, dateIso: string) {
  logger.info(`Persisting annual program history : ${annualProgram._id}.`);
  const historicalEntity = buildHistoricalEntity(
    constants.mongo.collectionNames.ANNUAL_PROGRAMS,
    annualProgram._id,
    dateIso,
    AnnualProgramStatus.programming
  );
  try {
    await historicalsCollection.insert(historicalEntity);
  } catch (e) {
    logger.error(e, `Persisting annual program history failed : ${annualProgram._id}.`);
    return;
  }
  logger.info(`Persisted annual program history : ${annualProgram._id}.`);
}

function buildHistoricalEntity(collectionName: string, collectionId: string, dateIso: string, status: string): any {
  return {
    collectionName,
    collectionId,
    diff: {
      audit: {
        lastModifiedAt: dateIso,
        lastModifiedBy: 'System'
      },
      status
    },
    version: 0,
    createdAt: dateIso,
    updatedAt: dateIso,
    __v: 0
  };
}

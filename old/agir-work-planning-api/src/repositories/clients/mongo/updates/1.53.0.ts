import {
  IEnrichedProject,
  ProgramBookPriorityScenarioStatus,
  ProgramBookStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';
import * as mongoose from 'mongoose';

import { constants } from '../../../../../config/constants';
import { Audit } from '../../../../features/audit/audit';
import { Author } from '../../../../features/audit/author';
import { PriorityLevel } from '../../../../features/priorityScenarios/models/priorityLevel';
import { PriorityLevelCriteria } from '../../../../features/priorityScenarios/models/priorityLevelCriteria';
import { PriorityScenario } from '../../../../features/priorityScenarios/models/priorityScenario';
import { programBookPriorityScenarioService } from '../../../../features/priorityScenarios/priorityScenarioService';
import { PriorityLevelsValidator } from '../../../../features/priorityScenarios/validators/priorityLevelsValidator';
import { ProgramBook } from '../../../../features/programBooks/models/programBook';
import { programBookRepository } from '../../../../features/programBooks/mongo/programBookRepository';
import { systemUser } from '../../../../services/auditService';
import { createLogger } from '../../../../utils/logger';
import { MomentUtils } from '../../../../utils/moment/momentUtils';

const logger = createLogger('mongo/1.53.0');
let programBooksCollectionDB: MongoDb.Collection<any>;
let annualProgramsCollectionDB: MongoDb.Collection<any>;
let projectsCollectionDB: MongoDb.Collection<any>;

interface IProgramBookResults {
  programBook: ProgramBook;
  annualProgramId: string;
}

export default async function update(db: MongoDb.Db): Promise<void> {
  programBooksCollectionDB = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  annualProgramsCollectionDB = db.collection(constants.mongo.collectionNames.ANNUAL_PROGRAMS);
  projectsCollectionDB = db.collection(constants.mongo.collectionNames.PROJECTS);
  const programBooksResults = await getMatchingProgramBooks();
  if (programBooksResults?.length) {
    await updateProgramBooksWithDefaultPriorityScenario(programBooksCollectionDB, programBooksResults);
  }
}

function generateDefaultPriorityScenario(): PriorityScenario {
  const priorityLevelCriteriaResult = PriorityLevelCriteria.create({});

  const priorityLevelResult = PriorityLevel.create({
    criteria: priorityLevelCriteriaResult.getValue(),
    isSystemDefined: true,
    projectCount: 0,
    rank: 1
  });

  const audit: Audit = Audit.create({
    createdAt: MomentUtils.now().toISOString(),
    createdBy: Author.create(systemUser).getValue()
  }).getValue();

  const priorityScenarioResult = PriorityScenario.create({
    id: mongoose.Types.ObjectId().toHexString(),
    name: 'Scénario 1',
    priorityLevels: [priorityLevelResult.getValue()],
    orderedProjects: [],
    isOutdated: false,
    status: ProgramBookPriorityScenarioStatus.pending,
    audit
  });
  return priorityScenarioResult.getValue();
}

async function updateProgramBooksWithDefaultPriorityScenario(
  programBooksCollection: MongoDb.Collection,
  programBooksResults: IProgramBookResults[]
): Promise<void> {
  const priorityScenario = generateDefaultPriorityScenario();
  let err = '';
  let count = 0;
  for (const programBookResult of programBooksResults) {
    try {
      programBookResult.programBook.addOrReplacePriorityScenario(priorityScenario);
      const result = PriorityLevelsValidator.validateBusinessRules(
        programBookResult.programBook,
        priorityScenario.priorityLevels
      );
      if (result.isFailure) throw result.error;
      let programBookProjects: IEnrichedProject[] = [];
      programBookProjects = await getProjectsByProgramBookId(programBookResult.programBook.id);
      const annualPeriodYear = await getAnnualPeriodYear(programBookResult.annualProgramId);
      const resultsUpdatePriorityLevels = await programBookPriorityScenarioService.updatePriorityLevelsCount(
        priorityScenario.priorityLevels,
        programBookProjects,
        annualPeriodYear,
        programBookResult.programBook
      );
      if (resultsUpdatePriorityLevels.find(r => r.isFailure)) {
        throw resultsUpdatePriorityLevels.find(r => r.isFailure).error;
      }
      programBookResult.programBook.addOrReplacePriorityScenario(priorityScenario);
      count += await persistProgramBook(programBooksCollection, programBookResult.programBook);
    } catch (e) {
      err = `${err}\nError -> ${programBookResult.programBook.id}: ${e}`;
    }
  }
  if (err) {
    logger.info(`${err}`);
  }
  logger.info(`Adding default priority scenario in programBooks ( ${count} / ${programBooksResults.length} )`);
}

async function getMatchingProgramBooks(): Promise<IProgramBookResults[]> {
  const includedStatus = [ProgramBookStatus.new, ProgramBookStatus.programming];
  const programBooks = await programBooksCollectionDB
    .find({
      $and: [
        { status: { $in: includedStatus } },
        {
          $or: [{ priorityScenarios: { $exists: false } }, { 'priorityScenarios.priorityLevels': { $exists: false } }]
        }
      ]
    })
    .toArray();
  return await Promise.all(
    programBooks.map(async pb => {
      return {
        programBook: await programBookRepository.toDomainModel(pb, ['none']),
        annualProgramId: pb.annualProgramId
      };
    })
  );
}

async function getProjectsByProgramBookId(id: string): Promise<IEnrichedProject[]> {
  const projects = await projectsCollectionDB
    .find({ 'annualDistribution.annualPeriods.programBookId': { $in: [mongoose.Types.ObjectId(id)] } })
    .toArray();
  return projects;
}

async function persistProgramBook(
  programBooksCollection: MongoDb.Collection,
  programBook: ProgramBook
): Promise<number> {
  try {
    await programBooksCollection.update(
      { _id: mongoose.Types.ObjectId(programBook.id) },
      {
        $set: {
          priorityScenarios: programBook.priorityScenarios.map(s => PriorityScenario.toPersistence(s))
        }
      }
    );
  } catch (e) {
    return 0;
  }
  return 1;
}

async function getAnnualPeriodYear(id: string): Promise<number> {
  const annualProgram = await annualProgramsCollectionDB.findOne({
    _id: id
  });
  if (annualProgram) return annualProgram.year;
  return undefined;
}

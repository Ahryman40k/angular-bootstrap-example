import { ProjectCategory } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { IProgramBookProps } from '../../../../features/programBooks/models/programBook';
import { ProgramBookModel } from '../../../../features/programBooks/mongo/programBookModel';
import { ProjectModel } from '../../../../features/projects/mongo/projectModel';
import { auditService } from '../../../../services/auditService';
import { createLogger } from '../../../../utils/logger';
import { CustomModel } from '../../../mongo/customModel';

/**
 * For V2.4.4 we need to add ordered projects to programBook's priorityScenarios
 */
const logger = createLogger('mongo/2.4.4');
let programBookCollection: MongoDb.Collection<ProgramBookModel>;
let projectCollection: MongoDb.Collection<ProjectModel>;
export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = new Date().getTime();
  programBookCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  projectCollection = db.collection(constants.mongo.collectionNames.PROJECTS);
  const programBooks = await getProgramBooks();
  await updatePriorityScenario(programBooks);
  await persistProgramBooks(programBooks);
  const milliseconds = new Date().getTime() - startTime;
  logger.info(`Script 2.4.4 executed in ${milliseconds} milliseconds`);
}

async function updatePriorityScenario(programBooks: any[]) {
  for (const programBook of programBooks) {
    const priorityScenario = programBook.priorityScenarios[0];
    const projects = await projectCollection
      .find({ 'annualDistribution.annualPeriods.programBookId': programBook._id })
      .toArray();
    let rank = 0;
    for (const project of projects) {
      rank++;
      const orderedProject = generateOrderedProject(project, rank, programBook._id);
      priorityScenario.orderedProjects.push(orderedProject);
    }
    priorityScenario.isOutdated = true;
    priorityScenario.audit = auditService.buildSystemAudit(priorityScenario.audit);
    programBook.priorityScenarios[0] = priorityScenario;
  }
}

function generateOrderedProject(project: any, rank: number, programBookId: string) {
  const annualPeriod = project.annualDistribution.annualPeriods.find((ap: any) => ap.programBookId === programBookId);
  const levelRank = annualPeriod?.categoryId === ProjectCategory.completing ? 1 : 0;
  return {
    rank,
    projectId: project._id,
    levelRank,
    initialRank: rank,
    note: null as string
  };
}

async function getProgramBooks(): Promise<CustomModel<IProgramBookProps>[]> {
  return programBookCollection
    .find({
      'priorityScenarios.audit.createdBy.userName': 'system'
    })
    .toArray();
}

async function persistProgramBooks(programBooks: CustomModel<IProgramBookProps>[]): Promise<void> {
  for (const programBook of programBooks) {
    try {
      await programBookCollection.replaceOne(
        {
          _id: (programBook as any)._id
        },
        programBook
      );
    } catch (e) {
      throw e;
    }
  }
}

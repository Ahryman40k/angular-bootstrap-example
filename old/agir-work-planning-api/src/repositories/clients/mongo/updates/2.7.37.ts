import { IEnrichedProgramBook, IEnrichedProject, ProjectType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { chunk } from 'lodash';
import * as MongoDb from 'mongodb';

import { constants } from '../../../../../config/constants';
import { interventionRepository } from '../../../../features/interventions/mongo/interventionRepository';
import { createLogger } from '../../../../utils/logger';

const logger = createLogger('mongo/2.7.37');
let programBooksCollection: MongoDb.Collection;
let projectsCollection: MongoDb.Collection;
const DEFAULT_PROGRAM_TYPE = 'pcpr';

/**
 * For V2.7.37 we update program books to fit new validation rules
 */

export default async function update(db: MongoDb.Db): Promise<void> {
  const startTime = Date.now();
  programBooksCollection = db.collection(constants.mongo.collectionNames.PROGRAM_BOOKS);
  projectsCollection = db.collection(constants.mongo.collectionNames.PROJECTS);

  const programBooks = await findProgramBooks();
  await updateProgramBooks(programBooks);

  const milliseconds = Date.now() - startTime;
  logger.info(`Script 2.7.37 executed in ${milliseconds} milliseconds`);
}

async function updateProgramBooks(programBooks: IEnrichedProgramBook[]): Promise<void> {
  logger.info(`Update program books collection`);
  try {
    const promises = programBooks.map(async programBook => {
      const projects = await findProgramBookProjects(programBook.id);
      const pniProjects = projects?.filter(p => p.projectTypeId === ProjectType.nonIntegrated);
      if (programBook.projectTypes.length > 1) {
        if (!projects?.length || !pniProjects?.length) {
          programBook.projectTypes = programBook.projectTypes.filter((p: string) => p !== ProjectType.nonIntegrated);
        } else if (pniProjects?.length) {
          programBook.projectTypes = [ProjectType.nonIntegrated];
        }
      }
      if (programBook.projectTypes[0] === ProjectType.nonIntegrated) {
        if (pniProjects?.length) {
          const programs: string[] = [];
          pniProjects.forEach(async project => {
            programs.push(...(await getProjectPrograms(project)));
          });
          if (!programs?.length) {
            programBook.programTypes = [DEFAULT_PROGRAM_TYPE];
          }
        } else {
          programBook.programTypes = [DEFAULT_PROGRAM_TYPE];
        }
      }
      return programBooksCollection.findOneAndReplace({ _id: (programBook as any)._id }, programBook);
    });
    for (const chunkedPromises of chunk(promises, 10)) {
      try {
        await Promise.all(chunkedPromises);
      } catch (e) {
        logger.error(`Update program books error -> ${e}`);
      }
    }
  } catch (e) {
    logger.info(`Update program books error -> ${e}`);
  }
}

async function getProjectPrograms(project: IEnrichedProject): Promise<string[]> {
  const programs: string[] = [];
  project.interventionIds.forEach(async (id: string) => {
    const intervention = await interventionRepository.findById(id);
    const program = intervention.programId;
    if (program && !programs.includes(program)) {
      programs.push(program);
    }
  });
  return programs;
}

async function findProgramBooks(): Promise<IEnrichedProgramBook[]> {
  return programBooksCollection
    .find({
      projectTypes: ProjectType.nonIntegrated
    })
    .toArray();
}

async function findProgramBookProjects(programBookId: string): Promise<IEnrichedProject[]> {
  return projectsCollection
    .find({
      'annualDistribution.annualPeriods.programBookId': programBookId
    })
    .toArray();
}

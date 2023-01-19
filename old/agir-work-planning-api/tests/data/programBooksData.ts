import {
  IEnrichedIntervention,
  IEnrichedProgramBook,
  IEnrichedProject,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib';

import { db } from '../../src/features/database/DB';
import { ProgramBook } from '../../src/features/programBooks/models/programBook';
import { projectRepository } from '../../src/features/projects/mongo/projectRepository';
import { getMinimalInitialIntervention } from './interventionData';
import { createMockProject } from './projectData';

export type IEnrichedProgramBookPatch = Partial<IEnrichedProgramBook>;

class ProgramBooksData {
  public async createMockProjectInProgramBook(
    programBook: ProgramBook,
    projectOptions: any
  ): Promise<IEnrichedProject> {
    const projectArg = await createMockProject(projectOptions, {
      projectGeoAnnualDistribution: {
        annualPeriods: [{ programBookId: programBook.id, status: ProjectStatus.programmed, rank: 0 }]
      }
    });
    await db()
      .models.Project.updateOne({ _id: projectArg.id }, projectArg)
      .exec();
    return projectArg;
  }

  public async createMockProjectWithInterventionInProgramBook(
    programBook: ProgramBook,
    projectOptions: any,
    intervention?: IEnrichedIntervention
  ): Promise<IEnrichedProject> {
    const interventionModel = db().models.Intervention;
    const mockIntervention = intervention || getMinimalInitialIntervention();
    const interventionResult = await interventionModel.create(mockIntervention);
    projectOptions.interventionIds = [interventionResult.id];
    const projectArg = await createMockProject(projectOptions, {
      projectGeoAnnualDistribution: {
        annualPeriods: [{ programBookId: programBook.id, status: ProjectStatus.programmed, rank: 0 }]
      }
    });
    const saveProjectResult = await projectRepository.save(projectArg);
    return saveProjectResult.getValue();
  }

  public async updateMockProgramBook(
    programBook: ProgramBook,
    programBookPatch: IEnrichedProgramBookPatch
  ): Promise<ProgramBook> {
    const patchedProgramBook = Object.assign({}, programBook, programBookPatch);
    await db()
      .models.ProgramBook.updateOne({ _id: programBook.id }, patchedProgramBook)
      .exec();
    return patchedProgramBook;
  }
}

export const programBooksData = new ProgramBooksData();

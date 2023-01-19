import { IEnrichedProject, ProgramBookStatus, ProjectStatus } from '@villemontreal/agir-work-planning-lib/dist/src';
import * as _ from 'lodash';

import { InterventionFindOptions } from '../../../src/features/interventions/models/interventionFindOptions';
import { interventionRepository } from '../../../src/features/interventions/mongo/interventionRepository';
import { priorityScenarioMapperDTO } from '../../../src/features/priorityScenarios/mappers/priorityScenarioMapperDTO';
import { programBookPriorityScenarioService } from '../../../src/features/priorityScenarios/priorityScenarioService';
import { ProgramBook } from '../../../src/features/programBooks/models/programBook';
import { programBookRepository } from '../../../src/features/programBooks/mongo/programBookRepository';
import { projectRepository } from '../../../src/features/projects/mongo/projectRepository';
import { errorMtlMapper } from '../../../src/shared/domainErrors/errorMapperMtlApi';
import { InvalidParameterError } from '../../../src/shared/domainErrors/invalidParameterError';
import { UnexpectedError } from '../../../src/shared/domainErrors/unexpectedError';
import { Result } from '../../../src/shared/logic/result';

export interface IProgramBookCoupler {
  year: number;
  programBook: ProgramBook;
}

export interface IProgramBookCouples {
  projects: IEnrichedProject[];
  programBookCoupler?: IProgramBookCoupler;
}

class ProgramBookDataCoupler {
  public async coupleThem(coupleData: IProgramBookCouples): Promise<ProgramBook> {
    for (const project of coupleData.projects) {
      if (!_.isEmpty(project.interventionIds) && _.isEmpty(project.interventions)) {
        const interventionFindOptions = InterventionFindOptions.create({
          criterias: {
            id: project.interventionIds
          }
        });
        if (interventionFindOptions.isFailure) {
          throw errorMtlMapper.toApiError(new InvalidParameterError(Result.combineForError(interventionFindOptions)));
        }
        project.interventions = await interventionRepository.findAll(interventionFindOptions.getValue());
      }
    }
    if (coupleData.projects) {
      await this.addProgramBookToProjectAnnualPeriod(coupleData.programBookCoupler, coupleData.projects);
      const orderedProjectsWithObjectives = (
        await priorityScenarioMapperDTO.getFromModel(coupleData.programBookCoupler.programBook.priorityScenarios[0], {
          programBook: coupleData.programBookCoupler.programBook
        })
      ).orderedProjects.items;
      const orderedProjects = await programBookPriorityScenarioService.getPriorityScenarioOrderedProjects(
        coupleData.programBookCoupler.programBook.priorityScenarios[0],
        coupleData.projects,
        coupleData.programBookCoupler.year,
        orderedProjectsWithObjectives,
        coupleData.programBookCoupler.programBook.objectives
      );
      // reorder with current priorityScenario
      const priorityScenario = coupleData.programBookCoupler.programBook.priorityScenarios[0];
      const orderedProjectIds = priorityScenario.orderedProjects.map(pop => pop.projectId);
      const currentPriorityScenariosProjects = priorityScenario.orderedProjects;
      orderedProjects.forEach(orderedProject => {
        if (orderedProjectIds.includes(orderedProject.projectId)) {
          currentPriorityScenariosProjects[
            currentPriorityScenariosProjects.findIndex(pop => pop.projectId === orderedProject.projectId)
          ] = orderedProject;
        } else {
          currentPriorityScenariosProjects.push(orderedProject);
        }
      });

      coupleData.programBookCoupler.programBook.priorityScenarios[0].setOrderedProjects(
        currentPriorityScenariosProjects
      );
    }

    coupleData.programBookCoupler.programBook = (
      await programBookRepository.save(coupleData.programBookCoupler.programBook)
    ).getValue();
    return coupleData.programBookCoupler.programBook;
  }

  private async addProgramBookToProjectAnnualPeriod(
    programBookCoupler: IProgramBookCoupler,
    projects: IEnrichedProject[]
  ): Promise<void> {
    for (const project of projects) {
      const annualPeriod = project.annualDistribution.annualPeriods.find(ap => ap.year === programBookCoupler.year);
      annualPeriod.programBookId = programBookCoupler.programBook.id;
      annualPeriod.status = ProjectStatus.programmed;

      if (!project.status) project.status = ProjectStatus.programmed;

      programBookCoupler.programBook = ProgramBook.create(
        {
          ...programBookCoupler.programBook.props,
          status: ProgramBookStatus.programming
        },
        programBookCoupler.programBook.id
      ).getValue();

      const saveResult = await projectRepository.save(project);
      if (saveResult.isFailure) {
        if (saveResult.isFailure) {
          throw errorMtlMapper.toApiError(new UnexpectedError(Result.combineForError(saveResult)));
        }
      }
    }
  }
}
export const programBookDataCoupler = new ProgramBookDataCoupler();

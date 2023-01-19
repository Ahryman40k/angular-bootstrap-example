import {
  AnnualProgramStatus,
  IEnrichedProject,
  IEnrichedProjectAnnualPeriod,
  IProjectDecision,
  ProgramBookStatus,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, maxBy } from 'lodash';

import { annualPeriodService } from '../../services/annualPeriodService';
import { UnexpectedError } from '../../shared/domainErrors/unexpectedError';
import { Result } from '../../shared/logic/result';
import { annualPeriodMapperDTO } from '../annualPeriods/mappers/annualPeriodMapperDTO';
import { ProjectAnnualPeriod } from '../annualPeriods/models/projectAnnualPeriod';
import { annualProgramStateMachine } from '../annualPrograms/annualProgramStateMachine';
import { annualProgramRepository } from '../annualPrograms/mongo/annualProgramRepository';
import { Audit } from '../audit/audit';
import { OrderedProject } from '../priorityScenarios/models/orderedProject';
import { programBookPriorityScenarioService } from '../priorityScenarios/priorityScenarioService';
import { projectService } from '../projects/projectService';
import { ProgramBook } from './models/programBook';
import { programBookStateMachine } from './programBookStateMachine';

interface IProgramBookService {
  updateProgramBookStatusWithAnnualPeriod(programBook: ProgramBook, annualPeriod: ProjectAnnualPeriod): Promise<void>;
  programProject(project: IEnrichedProject, programBook: ProgramBook, annualPeriod: ProjectAnnualPeriod): Promise<void>;
  removeAnnualPeriodFromProgramBook(annualPeriod: ProjectAnnualPeriod): Promise<void>;
  applyProjectDecisionOnProgramBook(
    programBook: ProgramBook,
    originalProject: IEnrichedProject,
    project: IEnrichedProject,
    decisionTypeId?: IProjectDecision['typeId']
  ): void;
}

class ProgramBookService implements IProgramBookService {
  public async updateProgramBookStatusWithAnnualPeriod(
    programBook: ProgramBook,
    annualPeriod: ProjectAnnualPeriod
  ): Promise<void> {
    if (annualPeriod.programBook.id && programBook.status === ProgramBookStatus.new) {
      await programBookStateMachine.execute(programBook, ProgramBookStatus.programming);
    }
  }

  public applyProjectDecisionOnProgramBook(
    programBook: ProgramBook,
    originalProject: IEnrichedProject,
    updatedProject: IEnrichedProject
  ): void {
    programBookPriorityScenarioService.outdateProgramBookPriorityScenarios(programBook);
    const removedAnnualPeriods = this.getRemovedAnnualPeriods(programBook.id, originalProject, updatedProject);
    if (removedAnnualPeriods?.length) {
      this.addRemovedProjectId(programBook, updatedProject);
      this.removedProjectFromOrderProjectList(programBook, updatedProject);
    } else {
      this.addProjectToOrderProjectList(programBook, updatedProject);
    }
    this.tryRemoveProjectFromProgramBookRemovedProjectIds(programBook, updatedProject);
  }

  public getRemovedAnnualPeriods(
    programBookId: string,
    originalProject: IEnrichedProject,
    updatedProject: IEnrichedProject
  ): IEnrichedProjectAnnualPeriod[] {
    const originalProjectAnnualPeriods = projectService.getProjectAnnualPeriodsFromProgramBookId(
      programBookId,
      originalProject
    );
    if (!originalProjectAnnualPeriods.length) {
      return null;
    }
    const updatedProjectAnnualPeriodsYears = projectService
      .getProjectAnnualPeriodsFromProgramBookId(programBookId, updatedProject)
      .map(x => x.year);
    return originalProjectAnnualPeriods.filter(x => !updatedProjectAnnualPeriodsYears.includes(x.year));
  }

  private addRemovedProjectId(programBook: ProgramBook, persistedProject: IEnrichedProject): void {
    programBook.removedProjects.splice(0, 0, persistedProject);
  }

  public removedProjectFromOrderProjectList(programBook: ProgramBook, project: IEnrichedProject): void {
    for (const priorityScenario of programBook.priorityScenarios) {
      priorityScenario.props.orderedProjects = priorityScenario.orderedProjects.filter(
        ps => ps.projectId !== project.id
      );
    }
  }

  public addProjectToOrderProjectList(programBook: ProgramBook, persistedProject: IEnrichedProject): void {
    const priorityScenarios = programBook.priorityScenarios;

    priorityScenarios.forEach(priorityScenario => {
      const maxRank = maxBy(priorityScenario.orderedProjects, ps => ps?.rank)?.rank || 0;
      // TODO ?
      // HOW TO CREATE ORDERED PROJECT
      const orderedProject: OrderedProject = OrderedProject.create({
        projectId: persistedProject.id,
        levelRank: undefined,
        initialRank: undefined,
        rank: maxRank + 1,
        isManuallyOrdered: false,
        note: undefined,
        audit: Audit.fromCreateContext()
      }).getValue();
      priorityScenario.orderedProjects.push(orderedProject);
    });
  }

  /**
   * Tries to remove the updated project ID from the program book's list of removed project IDs.
   * If the updated project doesn't have any annualPeriod that matches the program book, then we ignore the action.
   * If the project has matching annualPeriods, then we remove the project's ID from the program book's list of removed project IDs.
   * @param programBook The program book containing the removed project IDs.
   * @param updatedProject The project that has been updated.
   */
  public tryRemoveProjectFromProgramBookRemovedProjectIds(
    programBook: ProgramBook,
    updatedProject: IEnrichedProject
  ): void {
    const updatedProjectAnnualPeriods = projectService.getProjectAnnualPeriodsFromProgramBookId(
      programBook.id,
      updatedProject
    );
    if (!updatedProjectAnnualPeriods.length) {
      return;
    }
    const index = programBook.removedProjects.map(project => project.id).indexOf(updatedProject.id, 0);
    if (index > -1) {
      programBook.removedProjects.splice(index, 1);
    }
  }

  // TODO REFACTOR ------------------------------------------
  public async programProject(
    project: IEnrichedProject,
    programBook: ProgramBook,
    annualPeriod: ProjectAnnualPeriod,
    computeObjectives = true
  ): Promise<void> {
    await this.addProgramBookToAnnualPeriod(programBook, annualPeriod);
    const computedProjectStatus: ProjectStatus = await projectService.getProjectProgrammedStatusByProgramBooks(
      project,
      [...projectService.getProgramBookIds(project), programBook.id]
    );
    await this.updateProjectStatusTransition(project, computedProjectStatus);
    await this.updateProgramBookStatusWithAnnualPeriod(programBook, annualPeriod);
    if (programBook.annualProgram.status === AnnualProgramStatus.new) {
      await annualProgramStateMachine.execute(programBook.annualProgram, AnnualProgramStatus.programming);
    }
    if (computeObjectives) {
      const computeObjectivesResult = await programBook.computeObjectives();
      if (computeObjectivesResult.isFailure) {
        throw new UnexpectedError(Result.combineForError(computeObjectivesResult));
      }
    }
  }

  private async addProgramBookToAnnualPeriod(
    programBook: ProgramBook,
    annualPeriod: ProjectAnnualPeriod
  ): Promise<void> {
    annualPeriod.setProgramBook(programBook);
    await this.updateAnnualPeriodStatusTransition(annualPeriod, ProjectStatus.programmed);
  }

  public async removeAnnualPeriodFromProgramBook(annualPeriod: ProjectAnnualPeriod): Promise<void> {
    annualPeriod.setProgramBook(null);
    await this.updateAnnualPeriodStatusTransition(annualPeriod, ProjectStatus.planned);
  }

  public async getProgramBookYear(programBook: ProgramBook): Promise<number> {
    return (await annualProgramRepository.findById(programBook.annualProgram.id)).year;
  }

  // This function should be added when the refactor <<program project>> will be completed.
  // to more info check comments of this ticket: https://jira.montreal.ca/browse/APOC-8381
  public async addProjectToProgramBook(
    project: IEnrichedProject,
    programBook: ProgramBook,
    computeObjectives = true
  ): Promise<void> {
    const annualPeriodWithPBIndex = project.annualDistribution.annualPeriods.findIndex(
      x => x.year === programBook.annualProgram.year
    );
    const annualPeriod = project.annualDistribution.annualPeriods[annualPeriodWithPBIndex];
    const annualPeriodInstance = await ProjectAnnualPeriod.fromEnrichedToInstance(annualPeriod);
    await this.programProject(project, programBook, annualPeriodInstance, computeObjectives);
    project.annualDistribution.annualPeriods[annualPeriodWithPBIndex] = await annualPeriodMapperDTO.getFromModel(
      annualPeriodInstance
    );
  }

  public postAddProjectToProgramBook(programBook: ProgramBook, persistedProjectResult: IEnrichedProject) {
    programBookService.addProjectToOrderProjectList(programBook, persistedProjectResult);
    programBookService.tryRemoveProjectFromProgramBookRemovedProjectIds(programBook, persistedProjectResult);
  }

  private async updateProjectStatusTransition(project: IEnrichedProject, status: ProjectStatus): Promise<void> {
    if (isEmpty(project)) {
      return;
    }
    await projectService.updateProjectInProgramBookStatus(project, status);
  }

  private async updateAnnualPeriodStatusTransition(
    annualPeriod: ProjectAnnualPeriod,
    status: ProjectStatus
  ): Promise<void> {
    if (isEmpty(annualPeriod)) {
      return;
    }
    await annualPeriodService.updateAnnualPeriodInProgramBookStatus(annualPeriod, status);
  }
}

export const programBookService = new ProgramBookService();

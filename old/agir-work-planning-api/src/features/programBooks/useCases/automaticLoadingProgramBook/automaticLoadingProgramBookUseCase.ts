import { ProgramBookExpand } from '@villemontreal/agir-work-planning-lib';
import {
  BoroughCode,
  IEnrichedProject,
  ProjectExpand,
  ProjectStatus,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty, isNil } from 'lodash';

import { ByUuidCommand, IByUuidCommandProps } from '../../../../shared/domain/useCases/byUuidCommand';
import { Response, UseCase } from '../../../../shared/domain/useCases/useCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { UnprocessableEntityError } from '../../../../shared/domainErrors/unprocessableEntityError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { enumValues } from '../../../../utils/enumUtils';
import { fireAndForget } from '../../../../utils/fireAndForget';
import { createLogger } from '../../../../utils/logger';
import { programBookPriorityScenarioService } from '../../../priorityScenarios/priorityScenarioService';
import { IProjectCriterias, ProjectFindOptions } from '../../../projects/models/projectFindOptions';
import { projectRepository } from '../../../projects/mongo/projectRepository';
import { ProgramBook } from '../../models/programBook';
import { programBookRepository } from '../../mongo/programBookRepository';
import { programBookService } from '../../programBookService';
import { ProgramBookValidator } from '../../validators/programBookValidator';

const logger = createLogger('AutomaticLoadingProgramBookUseCase');

export class AutomaticLoadingProgramBookUseCase extends UseCase<IByUuidCommandProps, void> {
  public async execute(req: IByUuidCommandProps): Promise<Response<void>> {
    const byUuIdResult = ByUuidCommand.create(req);

    if (byUuIdResult.isFailure) {
      return left(new InvalidParameterError(byUuIdResult.errorValue()));
    }
    const byUuidCommand: ByUuidCommand = byUuIdResult.getValue();

    const programBook = await programBookRepository.findById(byUuidCommand.id, [ProgramBookExpand.annualProgram]);
    if (!programBook) {
      return left(new NotFoundError(`ProgramBook with id ${byUuidCommand.id} was not found`));
    }
    if (isEmpty(programBook.annualProgram)) {
      return left(new NotFoundError(`Annual Program was not found`));
    }
    const restrictionResult = ProgramBookValidator.validateRestrictions(
      programBook.annualProgram.executorId,
      programBook.boroughIds
    );
    if (restrictionResult.isFailure) {
      return left(new ForbiddenError(restrictionResult.errorValue()));
    }

    const businessRulesResults = ProgramBookValidator.validateAutomaticLoading(programBook);
    if (businessRulesResults.isFailure) {
      return left(new UnprocessableEntityError(Result.combineForError(businessRulesResults)));
    }
    // tslint:disable-next-line: return-undefined
    fireAndForget(async () => {
      logger.info(`Start AutomaticLoadingProgramBookUseCase`);
      const originalProgramBook: ProgramBook = cloneDeep(programBook);
      let originalProjects: IEnrichedProject[];
      let projectsToAddInProgramBook: IEnrichedProject[] = [];
      try {
        await this.saveProgramBook(programBook, true);
        if (programBook.projectTypes.includes(ProjectType.nonIntegrated)) {
          const pniProjects = await this.getPniProjects(programBook);
          if (!isEmpty(pniProjects)) {
            projectsToAddInProgramBook = [...pniProjects];
          }
        } else {
          const nonPniProjects = await this.getNonPniProjects(programBook);
          projectsToAddInProgramBook = projectsToAddInProgramBook.concat(nonPniProjects);
        }
        // next step get interventions without project associated.

        // add projects to program book.
        if (projectsToAddInProgramBook.length) {
          originalProjects = cloneDeep(projectsToAddInProgramBook);
          await this.addProjectsToProgramBook(programBook, projectsToAddInProgramBook);
        }
        await this.saveProgramBook(programBook, false);
        logger.info(`End AutomaticLoadingProgramBookUseCase`);
      } catch (error) {
        logger.error(error, `Error while automatic loading program book`);
        // rollback using original instances.
        await this.saveProgramBook(originalProgramBook, false);
        await this.saveProjects(originalProjects);
      }
    });
    return right(Result.ok<void>());
  }

  private async saveProgramBook(programBook: ProgramBook, isAutomaticLoadingInProgress: boolean): Promise<void> {
    programBook.setIsAutomaticLoadingInProgress(isAutomaticLoadingInProgress);
    const programBookRepositoryResult = await programBookRepository.save(programBook);
    if (programBookRepositoryResult.isFailure) {
      logger.info(programBookRepositoryResult.errorValue(), `Error to save program book id: ${programBook.id}`);
    }
  }
  private async saveProjects(projects: IEnrichedProject[]): Promise<void> {
    if (isEmpty(projects)) {
      return;
    }
    const saveBulkResult = await projectRepository.saveBulk(projects, {
      upsert: true
    });
    if (saveBulkResult.isFailure) {
      logger.info(saveBulkResult.errorValue(), `Error saving projects`);
    }
  }

  private async addProjectsToProgramBook(programBook: ProgramBook, projects: IEnrichedProject[]): Promise<void> {
    // first set each outdate of priority scenario to true.
    programBookPriorityScenarioService.outdateProgramBookPriorityScenarios(programBook);
    // add all projects to the program book.
    for (const project of projects) {
      // Do not compute programbook objectives
      // Do it later when all projects are added
      await programBookService.addProjectToProgramBook(project, programBook, false);
      const persistedProjectResult = await projectRepository.save(project);
      if (persistedProjectResult.isFailure) {
        throw new UnexpectedError(
          persistedProjectResult.errorValue(),
          `Error to add project id: ${project.id} to program book id: ${programBook.id}`
        );
      }
      // after save project we must update decisions on program book.
      programBookService.postAddProjectToProgramBook(programBook, persistedProjectResult.getValue());
    }
    // update objectives of program book.
    const programBookComputeObjectivesResult = await programBook.computeObjectives();
    if (programBookComputeObjectivesResult.isFailure) {
      throw new UnexpectedError(
        programBookComputeObjectivesResult.errorValue(),
        'Error while updating objectives of the program book'
      );
    }
  }

  private removeProjectsWithProgramBookAssigned(
    programBook: ProgramBook,
    projects: IEnrichedProject[]
  ): IEnrichedProject[] {
    // remove projects with a program book assigned.
    return projects
      .filter(project =>
        project.annualDistribution?.annualPeriods.find(
          annualPeriod => isNil(annualPeriod?.programBookId) && annualPeriod?.year === programBook.annualProgram.year
        )
      ) // remove project with an invalid intervention program id.
      .filter(project => this.isInterventionValidToAddProject(programBook, project));
  }

  private isInterventionValidToAddProject(programBook: ProgramBook, project: IEnrichedProject): boolean {
    // if program book program types is null, undefined or empty array the project should be added.
    if (!programBook?.programTypes.length) {
      return true;
    }
    // by definition PNI projects should have only one intervention.
    if (project?.interventions.find(i => programBook.programTypes.includes(i.programId))) {
      return true;
    }
    return false;
  }

  private async getNonPniProjects(programBook: ProgramBook): Promise<IEnrichedProject[]> {
    const annualProgram = programBook.annualProgram;
    let projectCriterias: IProjectCriterias = {
      excludeProgramBookIds: programBook.id,
      status: enumValues<ProjectStatus>(ProjectStatus).filter(status => status !== ProjectStatus.canceled),
      projectTypeId: programBook.projectTypes,
      executorId: annualProgram.executorId,
      toStartYear: annualProgram.year,
      fromEndYear: annualProgram.year
    };
    if (!isEmpty(programBook.boroughIds) && !programBook.boroughIds.includes(BoroughCode.MTL)) {
      projectCriterias = { ...projectCriterias, boroughId: programBook.boroughIds };
    }

    const projectFindOptions = ProjectFindOptions.create({
      criterias: projectCriterias
    });

    if (projectFindOptions.isFailure) {
      throw new UnexpectedError(projectFindOptions.errorValue(), `Error creating project find options`);
    }
    const nonPniProjects = (await projectRepository.findAll(projectFindOptions.getValue())).filter(project =>
      project.annualDistribution?.annualPeriods.some(
        annualPeriod => isNil(annualPeriod?.programBookId) && annualPeriod?.year === programBook.annualProgram.year
      )
    );

    if (isEmpty(nonPniProjects)) {
      logger.info(`Could not find any valid project to add to program book given id: ${programBook.id}`);
      return [];
    }

    return nonPniProjects;
  }

  private async getPniProjects(programBook: ProgramBook): Promise<IEnrichedProject[] | undefined> {
    const annualProgram = programBook.annualProgram;
    let projectCriterias: IProjectCriterias = {
      excludeProgramBookIds: programBook.id,
      status: enumValues<ProjectStatus>(ProjectStatus).filter(status => status !== ProjectStatus.canceled),
      projectTypeId: ProjectType.nonIntegrated,
      executorId: annualProgram.executorId,
      toStartYear: annualProgram.year,
      fromEndYear: annualProgram.year
    };
    if (!isEmpty(programBook.boroughIds) && !programBook.boroughIds.includes(BoroughCode.MTL)) {
      projectCriterias = { ...projectCriterias, boroughId: programBook.boroughIds };
    }

    const projectFindOptions = ProjectFindOptions.create({
      criterias: projectCriterias,
      expand: ProjectExpand.interventions
    });

    if (projectFindOptions.isFailure) {
      throw new UnexpectedError(projectFindOptions.errorValue(), `Error creating project find options`);
    }
    const projectsPNI = await projectRepository.findAll(projectFindOptions.getValue());

    if (isEmpty(projectsPNI)) {
      logger.info(`Could not find any valid project to add to program book given id: ${programBook.id}`);
      return undefined;
    }
    const projectsPNIFiltered = this.removeProjectsWithProgramBookAssigned(programBook, projectsPNI);

    if (!projectsPNIFiltered.length) {
      logger.info(
        projectFindOptions.errorValue(),
        `Could not find any valid project to add to program book given id: ${programBook.id}`
      );
      return undefined;
    }
    return projectsPNIFiltered;
  }
}

export const automaticLoadingProgramBookUseCase = new AutomaticLoadingProgramBookUseCase();

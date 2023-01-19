import {
  IAudit,
  IEnrichedAnnualProgram,
  IEnrichedObjective,
  IEnrichedProgramBook,
  IEnrichedProject,
  IPriorityScenario,
  Permission,
  ProgramBookExpand
} from '@villemontreal/agir-work-planning-lib';
import { isEmpty, isNil, pick } from 'lodash';

import { userService } from '../../../services/userService';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { appUtils, IPaginatedResult } from '../../../utils/utils';
import { annualProgramMapperDTO } from '../../annualPrograms/mappers/annualProgramMapperDTO';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { IOrderedProjectMapperOptions } from '../../priorityScenarios/mappers/orderedProjectMapperDTO';
import { priorityScenarioMapperDTO } from '../../priorityScenarios/mappers/priorityScenarioMapperDTO';
import { ProgramBook } from '../models/programBook';
import { objectiveMapperDTO } from './objectiveMapperDTO';

// tslint:disable:no-empty-interface
export interface IProgramBookMapperOptions extends IOrderedProjectMapperOptions {
  priorityScenarioId?: string;
  hasAnnualProgram?: boolean;
  hasProjects?: boolean;
  projectLimit?: number;
  projectOffset?: number;
}

class ProgramBookMapperDTO extends FromModelToDtoMappings<
  ProgramBook,
  IEnrichedProgramBook,
  IProgramBookMapperOptions
> {
  protected async getFromNotNullModel(
    programBook: ProgramBook,
    options: IProgramBookMapperOptions
  ): Promise<IEnrichedProgramBook> {
    const [priorityScenariosDTO, objectivesDTO, auditDTO] = await Promise.all([
      !isEmpty(programBook.priorityScenarios)
        ? priorityScenarioMapperDTO.getFromModels(programBook.priorityScenarios, {
            ...options,
            programBook,
            fields: this.getOptionsNestedFields(options?.fields, 'priorityScenarios')
          })
        : [],
      !isEmpty(programBook.objectives) ? objectiveMapperDTO.getFromModels(programBook.objectives) : [],
      auditMapperDTO.getFromModel(programBook.audit)
    ]);
    let annualProgramDTO: IEnrichedAnnualProgram;
    let removedProjectsDTO: IPaginatedResult<IEnrichedProject>;
    let projectsDTO: IPaginatedResult<IEnrichedProject>;
    if (options?.hasAnnualProgram || options?.expand?.includes(ProgramBookExpand.annualProgram)) {
      annualProgramDTO = await annualProgramMapperDTO.getFromModel(programBook.annualProgram);
    }
    if (options?.expand?.includes(ProgramBookExpand.removedProjects)) {
      removedProjectsDTO = this.sortAndPaginateProjects(programBook.removedProjects, programBook, options);
    }
    if (
      options?.hasProjects ||
      options?.expand?.includes(ProgramBookExpand.projects) ||
      options?.expand?.includes(ProgramBookExpand.projectsInterventions)
    ) {
      projectsDTO = this.sortAndPaginateProjects(programBook.projects, programBook, options);
    }
    return this.map(
      programBook,
      priorityScenariosDTO,
      annualProgramDTO,
      removedProjectsDTO,
      projectsDTO,
      objectivesDTO,
      auditDTO,
      options
    );
  }

  private map(
    programBook: ProgramBook,
    priorityScenariosDTO: IPriorityScenario[],
    annualProgramDTO: IEnrichedAnnualProgram,
    removedProjectsDTO: IPaginatedResult<IEnrichedProject>,
    projectsDTO: IPaginatedResult<IEnrichedProject>,
    objectivesDTO: IEnrichedObjective[],
    auditDTO: IAudit,
    options: IProgramBookMapperOptions
  ): IEnrichedProgramBook {
    const fullReturn: IEnrichedProgramBook = {
      id: programBook.id,
      annualProgramId: programBook.annualProgram?.id,
      name: programBook.name,
      projectTypes: programBook.projectTypes,
      inCharge: programBook.inCharge,
      boroughIds: programBook.boroughIds,
      sharedRoles: programBook.sharedRoles,
      status: programBook.status,
      annualProgram: annualProgramDTO,
      objectives: objectivesDTO,
      projects: projectsDTO,
      removedProjects: removedProjectsDTO,
      removedProjectsIds: programBook.removedProjects.map(project => project.id),
      priorityScenarios: priorityScenariosDTO,
      programTypes: programBook.programTypes,
      description: programBook.description,
      isAutomaticLoadingInProgress: programBook.isAutomaticLoadingInProgress,
      audit: auditDTO
    };

    if (!isEmpty(options?.fields)) {
      return pick(fullReturn, [
        'id',
        'annualProgramId',
        ...options.fields,
        ...this.getOptionsNestedFields(options.fields, 'priorityScenarios', true)
      ]) as IEnrichedProgramBook;
    }

    return this.mapWithPermissions(fullReturn);
  }

  private mapWithPermissions(programBook: IEnrichedProgramBook): IEnrichedProgramBook {
    if (!userService.currentUser.hasPermission(Permission.ANNUAL_PROGRAM_READ_ALL)) {
      delete programBook.sharedRoles;
    }
    return programBook;
  }

  private sortAndPaginateProjects(
    projects: IEnrichedProject[],
    programBook: ProgramBook,
    options: IProgramBookMapperOptions
  ) {
    let sorted = projects;
    if (options?.priorityScenarioId) {
      const scenario = programBook.priorityScenarios.find(s => s.id === options.priorityScenarioId);
      sorted = scenario.orderedProjects
        .map(orderedProject => {
          return projects.find(p => p.id === orderedProject.projectId);
        })
        .filter(project => !isNil(project));
    }
    return appUtils.paginate<IEnrichedProject>(sorted, {
      offset: options?.projectOffset,
      limit: options?.projectLimit,
      totalCount: projects.length
    });
  }
}

export const programBookMapperDTO = new ProgramBookMapperDTO();

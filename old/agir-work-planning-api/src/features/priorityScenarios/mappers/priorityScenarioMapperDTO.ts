import {
  IAudit,
  IEnrichedPriorityLevel,
  IObjectiveCalculation,
  IOrderedProject,
  IPriorityScenario
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, pick, sortBy } from 'lodash';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { appUtils, IPaginatedResult } from '../../../utils/utils';
import { auditMapperDTO } from '../../audit/mappers/auditMapperDTO';
import { PriorityScenario } from '../models/priorityScenario';
import { IOrderedProjectMapperOptions, orderedProjectMapperDTO } from './orderedProjectMapperDTO';
import { priorityLevelMapperDTO } from './priorityLevelMapperDTO';

// tslint:disable:no-empty-interface
export interface IPriorityScenarioMapperOptions extends IOrderedProjectMapperOptions {}
class PriorityScenarioMapperDTO extends FromModelToDtoMappings<
  PriorityScenario,
  IPriorityScenario,
  IPriorityScenarioMapperOptions
> {
  protected async getFromNotNullModel(
    priorityScenario: PriorityScenario,
    options: IPriorityScenarioMapperOptions
  ): Promise<IPriorityScenario> {
    const [priorityLevelsDTO, auditDTO] = await Promise.all([
      priorityLevelMapperDTO.getFromModels(priorityScenario.priorityLevels),
      auditMapperDTO.getFromModel(priorityScenario.audit)
    ]);

    let previousOrderedProjectObjectivesCalculation: IObjectiveCalculation[];
    const orderedProjectsDTO: IOrderedProject[] = [];
    for (const orderedProject of priorityScenario.orderedProjects) {
      const orderedProjectDto = await orderedProjectMapperDTO.getFromModel(orderedProject, {
        ...options,
        previousOrderedProjectObjectivesCalculation,
        fields: this.getOptionsNestedFields(options?.fields, 'orderedProjects')
      });
      previousOrderedProjectObjectivesCalculation = orderedProjectDto.objectivesCalculation;
      orderedProjectsDTO.push(orderedProjectDto);
    }

    return this.map(priorityScenario, orderedProjectsDTO, priorityLevelsDTO, auditDTO, options);
  }

  private map(
    priorityScenario: PriorityScenario,
    orderedProjectsDTO: IOrderedProject[],
    priorityLevelsDTO: IEnrichedPriorityLevel[],
    auditDTO: IAudit,
    options: IPriorityScenarioMapperOptions
  ): IPriorityScenario {
    const fullReturn: IPriorityScenario = {
      id: priorityScenario.id,
      name: priorityScenario.name,
      priorityLevels: priorityLevelsDTO,
      orderedProjects: this.sortAndPaginateOrderedProjects(orderedProjectsDTO, options),
      isOutdated: priorityScenario.isOutdated,
      status: priorityScenario.status,
      audit: auditDTO
    };
    if (!isEmpty(options?.fields)) {
      // Due to pagination, cant get directly inner OrderedProjects fields
      const hasOrderedProjects = options.fields.map(field => field.includes('orderedProjects'));
      const fields = options.fields;
      if (!isEmpty(hasOrderedProjects)) {
        fields.push('orderedProjects');
      }
      return pick(fullReturn, fields) as IPriorityScenario;
    }
    return fullReturn;
  }

  private sortAndPaginateOrderedProjects(
    orderedProjects: IOrderedProject[],
    options: IOrderedProjectMapperOptions
  ): IPaginatedResult<IOrderedProject> {
    let sortedProjects = orderedProjects;
    if (options?.projectOrderBy) {
      sortedProjects = sortBy(orderedProjects, [options.projectOrderBy]);
    }
    // Due to pagination, orderedProjects mapping is done here
    if (!isEmpty(options?.fields)) {
      sortedProjects = sortedProjects.map(
        sortedProject =>
          pick(sortedProject, this.getOptionsNestedFields(options.fields, 'orderedProjects')) as IOrderedProject
      );
    }
    return appUtils.paginate(sortedProjects, {
      offset: options?.projectOffset,
      limit: options?.projectLimit
    });
  }
}
export const priorityScenarioMapperDTO = new PriorityScenarioMapperDTO();

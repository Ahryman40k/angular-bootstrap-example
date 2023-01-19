import {
  IEnrichedPriorityLevel,
  IPriorityLevelSortCriteria,
  IProjectCategoryCriteria,
  IServicePriority
} from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { servicePriorityMapperDTO } from '../../servicePriority/mappers/servicePriorityMapperDTO';
import { PriorityLevel } from '../models/priorityLevel';
import { priorityLevelSortCriteriaMapperDTO } from './priorityLevelSortCriteriaMapperDTO';
import { projectCategoryCriteriaMapperDTO } from './projectCategoryCriteriaMapperDTO';

class PriorityLevelMapperDTO extends FromModelToDtoMappings<PriorityLevel, IEnrichedPriorityLevel, void> {
  protected async getFromNotNullModel(priorityLevel: PriorityLevel): Promise<IEnrichedPriorityLevel> {
    const [servicePrioritiesDTO, projectCategoriesDTO, sortCriteriasDTO] = await Promise.all([
      servicePriorityMapperDTO.getFromModels(priorityLevel.criteria.servicePriorities),
      projectCategoryCriteriaMapperDTO.getFromModels(priorityLevel.criteria.projectCategory),
      priorityLevelSortCriteriaMapperDTO.getFromModels(priorityLevel.sortCriterias)
    ]);

    return this.map(priorityLevel, servicePrioritiesDTO, projectCategoriesDTO, sortCriteriasDTO);
  }

  private map(
    priorityLevel: PriorityLevel,
    servicePrioritiesDTO: IServicePriority[],
    projectCategoriesDTO: IProjectCategoryCriteria[],
    sortCriteriasDTO: IPriorityLevelSortCriteria[]
  ): IEnrichedPriorityLevel {
    return {
      rank: priorityLevel.rank,
      criteria: {
        projectCategory: projectCategoriesDTO,
        workTypeId: priorityLevel.criteria?.workTypeId,
        requestorId: priorityLevel.criteria?.requestorId,
        assetTypeId: priorityLevel.criteria?.assetTypeId,
        interventionType: priorityLevel.criteria?.interventionType,
        servicePriorities: servicePrioritiesDTO
      },
      isSystemDefined: priorityLevel.isSystemDefined,
      projectCount: priorityLevel.projectCount,
      sortCriterias: sortCriteriasDTO
    };
  }
}
export const priorityLevelMapperDTO = new PriorityLevelMapperDTO();

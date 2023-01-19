import { IPriorityLevelSortCriteria } from '@villemontreal/agir-work-planning-lib/dist/src';
import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { PriorityLevelSortCriteria } from '../models/priorityLevelSortCriteria';

class PriorityLevelSortCriteriaMapperDTO extends FromModelToDtoMappings<
  PriorityLevelSortCriteria,
  IPriorityLevelSortCriteria,
  void
> {
  protected async getFromNotNullModel(sortCriteria: PriorityLevelSortCriteria): Promise<IPriorityLevelSortCriteria> {
    return this.map(sortCriteria);
  }

  private map(priorityLevelSortCriteria: PriorityLevelSortCriteria): IPriorityLevelSortCriteria {
    return {
      name: priorityLevelSortCriteria.name,
      rank: priorityLevelSortCriteria.rank,
      service: priorityLevelSortCriteria.service
    };
  }
}

export const priorityLevelSortCriteriaMapperDTO = new PriorityLevelSortCriteriaMapperDTO();

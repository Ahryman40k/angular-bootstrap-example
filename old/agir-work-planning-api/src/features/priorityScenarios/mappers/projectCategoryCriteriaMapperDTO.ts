import { IProjectCategoryCriteria } from '@villemontreal/agir-work-planning-lib/dist/src';

import { FromModelToDtoMappings } from '../../../shared/mappers/fromModelToDtoMappings';
import { ProjectCategoryCriteria } from '../models/projectCategoryCriteria';

class ProjectCategoryCriteriaMapperDTO extends FromModelToDtoMappings<
  ProjectCategoryCriteria,
  IProjectCategoryCriteria,
  void
> {
  protected async getFromNotNullModel(servicePriority: ProjectCategoryCriteria): Promise<IProjectCategoryCriteria> {
    return this.map(servicePriority);
  }

  private map(projectCategoryCriteria: ProjectCategoryCriteria): IProjectCategoryCriteria {
    return {
      category: projectCategoryCriteria.category,
      subCategory: projectCategoryCriteria.subCategory
    };
  }
}

export const projectCategoryCriteriaMapperDTO = new ProjectCategoryCriteriaMapperDTO();

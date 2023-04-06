import { MinimalProject, Project } from '@ahryman40k/types/project-api-types';
import { assert } from 'console';
import { IAbstractSystem } from '../infrastructure/in-memory-project.infrastructure';
import {z} from "zod"

export const IProjectService = z.object({
  create: z.function()
            .args(MinimalProject)
            .returns(z.promise( Project.nullable()  )),
  getByIds: z.function()
              .args(z.array(z.string()))
              .returns(z.promise( z.array(Project.nullable())  )),
})

export type IProjectService = z.infer<typeof IProjectService>


const hasValidName = (project: MinimalProject): boolean => {
  return project.projectName.length > 0;
};

export const createProjectService = (infra: Record<string, IAbstractSystem>): IProjectService => {
  
  assert(infra.memory);
  
  return {
    create: async (project) => {
      // Apply any validation rule on project here
      // So business rules become easier to follow
      if (!hasValidName(project)) {
        return null;
      }

      return infra.memory.add(project);
    },
    getByIds: async (ids) => {
      // Do validation
      return infra.memory.findByIds(ids);
    },
  };
};

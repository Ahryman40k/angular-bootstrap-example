import { MinimalProject, Project } from '@ahryman40k/types/project-api-types';

export type IAbstractSystem = {
  add(project: MinimalProject): Promise<Project | null>;
  update(project: Project): Promise<Project | null>;
  delete(ids: string[]): Promise<Array<Project | null>>;
  findByIds(ids: string[]): Promise<Array<Project | null>>;
};

export const createInMemoryDb = (config: any): IAbstractSystem => {
  const _db: Record<string, Project> = {};

  // Do connection to the external system (Postgres, Redis, ...)
  // Of course here, there is nothing to do because it's in memory

  const _exists = (id: string): boolean => {
    return _db[id] ? true : false;
  };

  return {
    add: async (project) => {
      if (!_exists(project.projectName)) {
        _db[project.projectName] = project;
        return project;
      }
      return null;
    },

    update: async (project) => {
      if (_exists(project.projectName)) {
        _db[project.projectName] = project;
        return project;
      }

      return null;
    },

    delete: async (ids) => {
      const _delete = (id: string): Project | null => {
        const result = _db[id];
        delete _db[id];
        return result;
      };

      return ids.map((id) => (_exists(id) ? _delete(id) : null));
    },

    findByIds: async (ids) => {
      return ids.map((id) => (_exists(id) ? _db[id] : null));
    },
  };
};

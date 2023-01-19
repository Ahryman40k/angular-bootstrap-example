import { ICountBy, IEnrichedProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Aggregate } from 'mongoose';

import { IBaseRepository } from '../../repositories/core/baseRepository';
import { ProjectFindOptions } from './models/projectFindOptions';

export interface IProjectRepository extends IBaseRepository<IEnrichedProject, ProjectFindOptions> {
  countBy(findOptions: ProjectFindOptions): Promise<ICountBy[]>;
  // TODO REMOVE IT
  setSort(aggregate: Aggregate<any>, query: any): void;
}

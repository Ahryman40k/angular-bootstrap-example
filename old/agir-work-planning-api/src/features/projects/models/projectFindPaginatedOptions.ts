import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IProjectCriterias, IProjectFindOptionsProps, ProjectFindOptions } from './projectFindOptions';

export interface IProjectFindPaginatedOptionsProps extends IProjectFindOptionsProps, IFindPaginatedProps {
  criterias: IProjectCriterias;
  offset: number;
  limit: number;
}

export class ProjectFindPaginatedOptions extends FindPaginated<IProjectFindPaginatedOptionsProps> {
  public static create(props: IProjectFindPaginatedOptionsProps): Result<ProjectFindOptions> {
    const guardFindOptions = ProjectFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<ProjectFindOptions>(guard);
    }
    const projectFindOptions = new ProjectFindOptions(props);
    return Result.ok<ProjectFindOptions>(projectFindOptions);
  }
}

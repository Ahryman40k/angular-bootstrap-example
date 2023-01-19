import { FindOne } from '../../../shared/findOptions/findOne';
import { Result } from '../../../shared/logic/result';
import { IProjectFindOptionsProps, ProjectFindOptions } from './projectFindOptions';

export class ProjectFindOneOptions extends FindOne<IProjectFindOptionsProps> {
  public static create(props: IProjectFindOptionsProps): Result<ProjectFindOptions> {
    const guard = ProjectFindOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<ProjectFindOptions>(guard);
    }
    const projectFindOptions = new ProjectFindOptions(props);
    return Result.ok<ProjectFindOptions>(projectFindOptions);
  }
}

import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IRequirementCriterias, IRequirementFindOptionsProps, RequirementFindOptions } from './requirementFindOptions';

export interface IRequirementFindPaginatedOptionsProps extends IRequirementFindOptionsProps, IFindPaginatedProps {
  criterias: IRequirementCriterias;
  limit: number;
  offset: number;
}

export class RequirementFindPaginatedOptions extends FindPaginated<IRequirementFindPaginatedOptionsProps> {
  public static create(props: IRequirementFindPaginatedOptionsProps): Result<RequirementFindPaginatedOptions> {
    const guardFindOptions = RequirementFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<RequirementFindPaginatedOptions>(guard);
    }
    const requirementFindOptions = new RequirementFindPaginatedOptions(props);
    return Result.ok<RequirementFindPaginatedOptions>(requirementFindOptions);
  }
}

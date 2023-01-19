import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  AnnualProgramFindOptions,
  IAnnualProgramCriterias,
  IAnnualProgramFindOptionsProps
} from './annualProgramFindOptions';

export interface IAnnualProgramFindPaginatedOptionsProps extends IAnnualProgramFindOptionsProps, IFindPaginatedProps {
  criterias: IAnnualProgramCriterias;
  limit: number;
  offset: number;
}

export class AnnualProgramFindPaginatedOptions extends FindPaginated<IAnnualProgramFindPaginatedOptionsProps> {
  public static create(props: IAnnualProgramFindPaginatedOptionsProps): Result<AnnualProgramFindPaginatedOptions> {
    const guardFindOptions = AnnualProgramFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<AnnualProgramFindPaginatedOptions>(guard);
    }
    const annualProgramFindOptions = new AnnualProgramFindPaginatedOptions(props);
    return Result.ok<AnnualProgramFindPaginatedOptions>(annualProgramFindOptions);
  }
}

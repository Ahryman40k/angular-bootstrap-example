import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IProgramBookCriterias, IProgramBookFindOptionsProps, ProgramBookFindOptions } from './programBookFindOptions';

export interface IProgramBookPaginatedFindOptionsProps extends IProgramBookFindOptionsProps, IFindPaginatedProps {
  criterias: IProgramBookCriterias;
  limit: number;
  offset: number;
  fields?: string | string[];
}

export class ProgramBookFindPaginatedOptions extends FindPaginated<IProgramBookPaginatedFindOptionsProps> {
  public static create(props: IProgramBookPaginatedFindOptionsProps): Result<ProgramBookFindPaginatedOptions> {
    const guardFindOptions = ProgramBookFindPaginatedOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<ProgramBookFindPaginatedOptions>(guard);
    }
    ProgramBookFindOptions.setDefaultValues(props);
    const programBookFindOptions = new ProgramBookFindPaginatedOptions(props);
    return Result.ok<ProgramBookFindPaginatedOptions>(programBookFindOptions);
  }

  public static guard(props: IProgramBookPaginatedFindOptionsProps): IGuardResult {
    const guardFindOptionsBase = FindPaginated.guard(props);
    const guardProgramBookFindOptions = ProgramBookFindOptions.guard(props);
    return Guard.combine([guardFindOptionsBase, guardProgramBookFindOptions]);
  }
}

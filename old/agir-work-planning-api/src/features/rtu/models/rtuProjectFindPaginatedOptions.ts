import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { IRtuProjectCriterias, IRtuProjectFindOptionsProps, RtuProjectFindOptions } from './rtuProjectFindOptions';

export interface IRtuProjectsPaginatedFindOptionsProps extends IFindPaginatedProps, IRtuProjectFindOptionsProps {
  criterias: IRtuProjectCriterias;
  limit: number;
  offset: number;
}

export class RtuProjectFindPaginatedOptions extends FindPaginated<IRtuProjectsPaginatedFindOptionsProps> {
  public static create(props: IRtuProjectsPaginatedFindOptionsProps): Result<RtuProjectFindPaginatedOptions> {
    const guardFindOptions = RtuProjectFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<RtuProjectFindPaginatedOptions>(guard);
    }
    const rtuProjectFindOptions = new RtuProjectFindPaginatedOptions(props);
    return Result.ok<RtuProjectFindPaginatedOptions>(rtuProjectFindOptions);
  }
}

import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';

// tslint:disable:no-empty-interface
export interface IBicImportLogPaginatedFindOptionsProps extends IFindPaginatedProps {}

export class BicImportLogFindPaginatedOptions extends FindPaginated<IBicImportLogPaginatedFindOptionsProps> {
  public static create(props: IBicImportLogPaginatedFindOptionsProps): Result<BicImportLogFindPaginatedOptions> {
    const guard = BicImportLogFindPaginatedOptions.guard(props);
    if (!guard.succeeded) {
      return Result.fail<BicImportLogFindPaginatedOptions>(guard);
    }
    const bicImportFindOptions = new BicImportLogFindPaginatedOptions(props);
    return Result.ok<BicImportLogFindPaginatedOptions>(bicImportFindOptions);
  }

  public static guard(props: IBicImportLogPaginatedFindOptionsProps): IGuardResult {
    return FindPaginated.guard(props);
  }
}

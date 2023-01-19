import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { ITaxonomyCriterias, ITaxonomyFindOptionsProps, TaxonomyFindOptions } from './taxonomyFindOptions';

export interface ITaxonomyFindPaginatedOptionsProps extends ITaxonomyFindOptionsProps, IFindPaginatedProps {
  criterias: ITaxonomyCriterias;
  offset: number;
  limit: number;
}

export class TaxonomyFindPaginatedOptions extends FindPaginated<ITaxonomyFindPaginatedOptionsProps> {
  public static create(props: ITaxonomyFindPaginatedOptionsProps): Result<TaxonomyFindOptions> {
    const guardFindOptions = TaxonomyFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<TaxonomyFindOptions>(guard);
    }
    const taxonomyFindOptions = new TaxonomyFindOptions(props);
    return Result.ok<TaxonomyFindOptions>(taxonomyFindOptions);
  }
}

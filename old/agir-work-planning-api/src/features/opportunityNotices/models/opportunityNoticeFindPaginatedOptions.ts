import { FindPaginated, IFindPaginatedProps } from '../../../shared/findOptions/findPaginated';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import {
  IOpportunityNoticeCriterias,
  IOpportunityNoticeFindOptionsProps,
  OpportunityNoticeFindOptions
} from './opportunityNoticeFindOptions';

export interface IOpportunityNoticePaginatedFindOptionsProps
  extends IOpportunityNoticeFindOptionsProps,
    IFindPaginatedProps {
  criterias: IOpportunityNoticeCriterias;
  limit: number;
  offset: number;
}

export class OpportunityNoticeFindPaginatedOptions extends FindPaginated<IOpportunityNoticePaginatedFindOptionsProps> {
  public static create(
    props: IOpportunityNoticePaginatedFindOptionsProps
  ): Result<OpportunityNoticeFindPaginatedOptions> {
    const guardFindOptions = OpportunityNoticeFindOptions.guard(props);
    const guardPaginated = FindPaginated.guard(props);
    const guard = Guard.combine([guardFindOptions, guardPaginated]);
    if (!guard.succeeded) {
      return Result.fail<OpportunityNoticeFindPaginatedOptions>(guard);
    }
    const opportunityNoticeFindOptions = new OpportunityNoticeFindPaginatedOptions(props);
    return Result.ok<OpportunityNoticeFindPaginatedOptions>(opportunityNoticeFindOptions);
  }
}

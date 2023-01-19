import { IEnrichedOpportunityNotice } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { IOpportunityNoticePaginatedFindOptionsProps } from '../../models/opportunityNoticeFindPaginatedOptions';
import { searchOpportunityNoticeUseCase, SearchOpportunityNoticeUseCase } from './searchOpportunityNoticeUseCase';

@autobind
export class SearchOpportunityNoticeController extends SearchController<
  IOpportunityNoticePaginatedFindOptionsProps,
  IEnrichedOpportunityNotice
> {
  protected useCase: SearchOpportunityNoticeUseCase = searchOpportunityNoticeUseCase;
}

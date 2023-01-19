import { ISubmission } from '@villemontreal/agir-work-planning-lib';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { ISubmissionFindPaginatedOptionsProps } from '../../models/submissionFindPaginatedOptions';
import { searchSubmissionUseCase, SearchSubmissionUseCase } from './searchSubmissionUseCase';

@autobind
export class SearchSubmissionController extends SearchController<ISubmissionFindPaginatedOptionsProps, ISubmission> {
  protected useCase: SearchSubmissionUseCase = searchSubmissionUseCase;
}

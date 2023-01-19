import { IEnrichedProgramBook } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { IProgramBookPaginatedFindOptionsProps } from '../../models/programBookFindPaginatedOptions';
import { searchProgramBooksUseCase, SearchProgramBooksUseCase } from './searchProgramBooksUseCase';

@autobind
export class SearchProgramBooksController extends SearchController<
  IProgramBookPaginatedFindOptionsProps,
  IEnrichedProgramBook
> {
  protected useCase: SearchProgramBooksUseCase = searchProgramBooksUseCase;
}

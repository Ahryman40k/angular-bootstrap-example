import { IEnrichedAnnualProgram } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';

import { SearchController } from '../../../../shared/controllers/searchController';
import { IAnnualProgramFindPaginatedOptionsProps } from '../../models/annualProgramFindPaginatedOptions';
import { searchAnnualProgramUseCase, SearchAnnualProgramUseCase } from './searchAnnualProgramUseCase';

@autobind
export class SearchAnnualProgramController extends SearchController<
  IAnnualProgramFindPaginatedOptionsProps,
  IEnrichedAnnualProgram
> {
  protected useCase: SearchAnnualProgramUseCase = searchAnnualProgramUseCase;
}

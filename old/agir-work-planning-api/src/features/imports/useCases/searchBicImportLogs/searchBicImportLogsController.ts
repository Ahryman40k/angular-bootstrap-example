import { IBicImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { IBicImportLogPaginatedFindOptionsProps } from '../../models/bicImportLogFindPaginatedOptions';
import { searchBicImportLogsUseCase, SearchBicImportLogsUseCase } from './searchBicImportLogsUseCase';

@autobind
export class SearchBicImportLogsController extends SearchController<
  IBicImportLogPaginatedFindOptionsProps,
  IBicImportLog
> {
  protected readonly useCase: SearchBicImportLogsUseCase = searchBicImportLogsUseCase;
}

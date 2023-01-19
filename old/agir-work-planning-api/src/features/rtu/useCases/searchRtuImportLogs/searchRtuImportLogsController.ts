import { IRtuImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { IRtuImportLogsPaginatedFindOptionsProps } from '../../models/rtuImportLogFindPaginatedOptions';
import { searchRtuImportLogsUseCase, SearchRtuImportLogsUseCase } from './searchRtuImportLogsUseCase';

@autobind
export class SearchRtuImportLogsController extends SearchController<
  IRtuImportLogsPaginatedFindOptionsProps,
  IRtuImportLog
> {
  protected useCase: SearchRtuImportLogsUseCase = searchRtuImportLogsUseCase;
}

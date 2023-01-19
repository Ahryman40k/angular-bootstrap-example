import { IRtuExportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { IRtuExportLogsPaginatedFindOptionsProps } from '../../models/rtuExportLogFindPaginatedOptions';
import { searchRtuExportLogsUseCase, SearchRtuExportLogsUseCase } from './searchRtuExportLogsUseCase';

@autobind
export class SearchRtuExportLogsController extends SearchController<
  IRtuExportLogsPaginatedFindOptionsProps,
  IRtuExportLog
> {
  protected useCase: SearchRtuExportLogsUseCase = searchRtuExportLogsUseCase;
}

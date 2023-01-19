import { INexoImportLog } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { INexoImportLogPaginatedFindOptionsProps } from '../../models/nexoImportSearchOptions';
import { searchNexoImportUseCase, SearchNexoImportUseCase } from './searchNexoImportUseCase';

@autobind
export class SearchNexoImportLogsController extends SearchController<
  INexoImportLogPaginatedFindOptionsProps,
  INexoImportLog
> {
  protected useCase: SearchNexoImportUseCase = searchNexoImportUseCase;
}

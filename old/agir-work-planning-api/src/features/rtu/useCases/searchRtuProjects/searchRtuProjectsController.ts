import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { IRtuProjectsPaginatedFindOptionsProps } from '../../models/rtuProjectFindPaginatedOptions';
import { SearchRtuProjectsUseCase, searchRtuProjectsUseCase } from './searchRtuProjectsUseCase';

@autobind
export class SearchRtuProjectsController extends SearchController<IRtuProjectsPaginatedFindOptionsProps, IRtuProject> {
  protected useCase: SearchRtuProjectsUseCase = searchRtuProjectsUseCase;
}

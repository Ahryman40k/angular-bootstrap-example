import { IRequirement } from '@villemontreal/agir-work-planning-lib/dist/src';

import * as autobind from 'autobind-decorator';
import { SearchController } from '../../../../shared/controllers/searchController';
import { IRequirementFindPaginatedOptionsProps } from '../../models/requirementFindPaginatedOptions';
import { searchRequirementUseCase, SearchRequirementUseCase } from './searchRequirementUseCase';

@autobind
export class SearchRequirementController extends SearchController<IRequirementFindPaginatedOptionsProps, IRequirement> {
  protected useCase: SearchRequirementUseCase = searchRequirementUseCase;
}

import { IRequirement } from '@villemontreal/agir-work-planning-lib';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { Result } from '../../../../shared/logic/result';
import { IRequirementRepository } from '../../iRequirementRepository';
import { requirementMapperDTO } from '../../mappers/requirementMapperDTO';
import { Requirement } from '../../models/requirement';
import {
  IRequirementFindPaginatedOptionsProps,
  RequirementFindPaginatedOptions
} from '../../models/requirementFindPaginatedOptions';
import { requirementRepository } from '../../mongo/requirementRepository';

export class SearchRequirementUseCase extends SearchUseCase<
  Requirement,
  IRequirement,
  IRequirementFindPaginatedOptionsProps
> {
  protected entityRepository: IRequirementRepository = requirementRepository;
  protected mapper = requirementMapperDTO;

  protected createCommand(req: IRequirementFindPaginatedOptionsProps): Result<RequirementFindPaginatedOptions> {
    return RequirementFindPaginatedOptions.create(req);
  }
}

export const searchRequirementUseCase = new SearchRequirementUseCase();

import { IRtuProject } from '@villemontreal/agir-work-planning-lib/dist/src';
import { SearchUseCase } from '../../../../shared/domain/useCases/searchUseCase/searchUseCase';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { rtuProjectMapperDTO } from '../../mappers/rtuProjectMapperDTO';
import { RtuProject } from '../../models/rtuProject';
import {
  IRtuProjectsPaginatedFindOptionsProps,
  RtuProjectFindPaginatedOptions
} from '../../models/rtuProjectFindPaginatedOptions';
import { IRtuProjectRepository, rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { RtuProjectValidator } from '../../validators/rtuProjectValidator';

export class SearchRtuProjectsUseCase extends SearchUseCase<
  RtuProject,
  IRtuProject,
  IRtuProjectsPaginatedFindOptionsProps
> {
  protected entityRepository: IRtuProjectRepository = rtuProjectRepository;
  protected mapper = rtuProjectMapperDTO;

  protected createCommand(req: IRtuProjectsPaginatedFindOptionsProps): Result<RtuProjectFindPaginatedOptions> {
    return RtuProjectFindPaginatedOptions.create(req);
  }

  protected async validatePermissions(options: RtuProjectFindPaginatedOptions): Promise<Result<IGuardResult>> {
    return RtuProjectValidator.validateUserPermissionFromCriterias(options.criterias);
  }
}

export const searchRtuProjectsUseCase = new SearchRtuProjectsUseCase();

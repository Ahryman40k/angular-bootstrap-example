import { CountByUseCase } from '../../../../shared/domain/useCases/countUseCase/countByUseCase';
import { IGuardResult } from '../../../../shared/logic/guard';
import { Result } from '../../../../shared/logic/result';
import { RtuProject } from '../../models/rtuProject';
import { IRtuProjectFindOptionsProps, RtuProjectFindOptions } from '../../models/rtuProjectFindOptions';
import { IRtuProjectRepository, rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { RtuProjectValidator } from '../../validators/rtuProjectValidator';

export class CountByRtuProjectUseCase extends CountByUseCase<RtuProject, IRtuProjectFindOptionsProps> {
  protected entityRepository: IRtuProjectRepository = rtuProjectRepository;

  protected createCommand(req: IRtuProjectFindOptionsProps): Result<RtuProjectFindOptions> {
    return RtuProjectFindOptions.create(req);
  }

  protected async validatePermissions(options: RtuProjectFindOptions): Promise<Result<IGuardResult>> {
    return RtuProjectValidator.validateUserPermissionFromCriterias(options.criterias);
  }
}

export const countByRtuProjectUseCase = new CountByRtuProjectUseCase();

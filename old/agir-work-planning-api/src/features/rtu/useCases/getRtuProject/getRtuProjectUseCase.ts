import { IRtuProject } from '@villemontreal/agir-work-planning-lib';

import { ByIdCommand, IByIdCommandProps } from '../../../../shared/domain/useCases/byIdCommand';
import { GetByIdUseCase } from '../../../../shared/domain/useCases/getByIdUseCase/getByIdUseCase';
import { ForbiddenError } from '../../../../shared/domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { NotFoundError } from '../../../../shared/domainErrors/notFoundError';
import { UnexpectedError } from '../../../../shared/domainErrors/unexpectedError';
import { GuardType } from '../../../../shared/logic/guard';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { rtuProjectMapperDTO } from '../../mappers/rtuProjectMapperDTO';
import { RtuProject } from '../../models/rtuProject';
import { RtuProjectFindOptions } from '../../models/rtuProjectFindOptions';
import { IRtuProjectRepository, rtuProjectRepository } from '../../mongo/rtuProjectRepository';
import { RtuProjectValidator } from '../../validators/rtuProjectValidator';

export class GetRtuProjectUseCase extends GetByIdUseCase<RtuProject, IRtuProject, RtuProjectFindOptions> {
  protected entityRepository: IRtuProjectRepository = rtuProjectRepository;
  protected mapper = rtuProjectMapperDTO;

  public async execute(req: IByIdCommandProps): Promise<any> {
    const byIdCmdResult = ByIdCommand.create(req, GuardType.VALID_RTU_PROJECT_ID);
    if (byIdCmdResult.isFailure) {
      return left(new InvalidParameterError(Result.combine([byIdCmdResult]).error));
    }
    const byIdCmd: ByIdCommand<IByIdCommandProps> = byIdCmdResult.getValue();

    const findOptionsResult: Result<RtuProjectFindOptions> = RtuProjectFindOptions.create({
      criterias: {
        id: byIdCmd.id
      }
    });
    if (findOptionsResult.isFailure) {
      return left(new UnexpectedError(findOptionsResult.errorValue()));
    }

    const rtuProject = await rtuProjectRepository.findOne(findOptionsResult.getValue());
    if (!rtuProject) {
      return left(new NotFoundError(`Rtu Project ${byIdCmd.id} was not found`));
    }

    // Validate user permission
    const validatePermissionResult = await RtuProjectValidator.validateUserPermissionFromRtuProject(rtuProject);
    if (validatePermissionResult.isFailure) {
      return left(new ForbiddenError(validatePermissionResult.errorValue()));
    }

    return right(Result.ok<IRtuProject>(await rtuProjectMapperDTO.getFromModel(rtuProject)));
  }
}

export const getRtuProjectUseCase = new GetRtuProjectUseCase();

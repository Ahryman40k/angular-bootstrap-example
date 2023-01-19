import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';

import { IBaseRepository } from '../../../../repositories/core/baseRepository';
import { InvalidParameterError } from '../../../../shared/domainErrors/invalidParameterError';
import { left } from '../../../../shared/logic/left';
import { Result } from '../../../../shared/logic/result';
import { right } from '../../../../shared/logic/right';
import { ForbiddenError } from '../../../domainErrors/forbiddenError';
import { FindOptions, IFindOptionsProps } from '../../../findOptions/findOptions';
import { IGuardResult } from '../../../logic/guard';
import { Entity } from '../../entity';
import { Response, UseCase } from '../useCase';

export abstract class CountByUseCase<E extends Entity<any>, F extends IFindOptionsProps> extends UseCase<
  F,
  Response<any>
> {
  protected abstract readonly entityRepository: IBaseRepository<E, FindOptions<any>>;

  protected abstract createCommand(req: IFindOptionsProps): Result<FindOptions<IFindOptionsProps>>;

  protected async validatePermissions(options: FindOptions<IFindOptionsProps>): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  public async execute(req: F): Promise<Response<any>> {
    const findOptionsResult = this.createCommand(req);

    if (findOptionsResult.isFailure) {
      return left(new InvalidParameterError(Result.combine([findOptionsResult]).error));
    }
    const findOptions = findOptionsResult.getValue();

    const permissionsResult = await this.validatePermissions(findOptions);
    if (permissionsResult.isFailure) {
      return left(new ForbiddenError(permissionsResult.errorValue()));
    }
    const countBy = await this.entityRepository.countBy(findOptions);

    return right(Result.ok<ICountBy[]>(countBy));
  }
}

import { IBaseRepository, IResultPaginated } from '../../../../repositories/core/baseRepository';
import { ForbiddenError } from '../../../domainErrors/forbiddenError';
import { InvalidParameterError } from '../../../domainErrors/invalidParameterError';
import { FindOptions } from '../../../findOptions/findOptions';
import { FindPaginated, IFindPaginatedProps } from '../../../findOptions/findPaginated';
import { IGuardResult } from '../../../logic/guard';
import { left } from '../../../logic/left';
import { Result } from '../../../logic/result';
import { right } from '../../../logic/right';
import { FromModelToDtoMappings, IMapperOptions } from '../../../mappers/fromModelToDtoMappings';
import { Entity } from '../../entity';
import { Response, UseCase } from '../useCase';

export abstract class SearchUseCase<E extends Entity<any>, DTO, F extends IFindPaginatedProps> extends UseCase<
  F,
  IResultPaginated<DTO>
> {
  protected abstract readonly entityRepository: IBaseRepository<E, FindOptions<F>>;
  protected abstract readonly mapper: FromModelToDtoMappings<E, DTO, void | any>;

  protected readonly findOptions: FindPaginated<F>;
  protected entity: E;

  protected abstract createCommand(req: F): Result<FindPaginated<F>>;

  protected getMapperOptions(options: FindPaginated<F>): IMapperOptions {
    return {
      expand: options?.expandOptions.map(expand => expand.field),
      fields: options.fields
    };
  }

  protected async validatePermissions(options: FindPaginated<F>): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async validateTaxonomies(req: F): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected async search(findOptions: FindPaginated<F>): Promise<IResultPaginated<E>> {
    return this.entityRepository.findPaginated(findOptions);
  }

  public async execute(req: F): Promise<Response<IResultPaginated<DTO>>> {
    const [findOptionsResult, taxonomyResult] = await Promise.all([
      this.createCommand(req),
      this.validateTaxonomies(req)
    ]);

    const inputValidationResult = Result.combine([findOptionsResult, taxonomyResult]);

    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(Result.combine([inputValidationResult]).error));
    }
    const findOptions = findOptionsResult.getValue();

    const permissionsResult = await this.validatePermissions(findOptions);
    if (permissionsResult.isFailure) {
      return left(new ForbiddenError(permissionsResult.errorValue()));
    }

    const resultPaginated = await this.search(findOptions);
    const paginatedResult: IResultPaginated<DTO> = {
      paging: resultPaginated.paging,
      items: await this.mapper.getFromModels(resultPaginated.items, this.getMapperOptions(findOptions))
    };

    return right(Result.ok<IResultPaginated<DTO>>(paginatedResult));
  }
}

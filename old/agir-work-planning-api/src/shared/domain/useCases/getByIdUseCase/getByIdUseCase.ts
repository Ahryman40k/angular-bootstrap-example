import { InvalidParameterError } from '../../../domainErrors/invalidParameterError';
import { NotFoundError } from '../../../domainErrors/notFoundError';
import { UnexpectedError } from '../../../domainErrors/unexpectedError';
import { FindOne } from '../../../findOptions/findOne';
import { FindOptions, IFindOptionsProps } from '../../../findOptions/findOptions';
import { IGuardResult } from '../../../logic/guard';
import { left } from '../../../logic/left';
import { Result } from '../../../logic/result';
import { right } from '../../../logic/right';
import { FromModelToDtoMappings, IMapperOptions } from '../../../mappers/fromModelToDtoMappings';
import { Entity } from '../../entity';
import { ByIdCommand, IByIdCommandProps } from '../byIdCommand';
import { ByIdUseCase } from '../byIdUseCase';

export abstract class GetByIdUseCase<
  E extends Entity<any>,
  O,
  F extends FindOne<IFindOptionsProps>
> extends ByIdUseCase<E, O> {
  protected abstract mapper: FromModelToDtoMappings<E, O, void | any>;
  protected findOptions: F;

  protected getFindOptions(byIdCmd: ByIdCommand<IByIdCommandProps>): Result<F> {
    return FindOptions.create({
      criterias: {
        id: byIdCmd.id
      }
    });
  }

  protected createCommand(req: IByIdCommandProps): Result<ByIdCommand<any>> {
    return ByIdCommand.create(req);
  }

  protected async validateTaxonomies(req: IByIdCommandProps): Promise<Result<IGuardResult>> {
    return Result.ok();
  }

  protected getMapperOptions(findOptions: F): IMapperOptions {
    return {
      fields: findOptions.fields,
      expand: findOptions?.expandOptions.map(expand => expand.field)
    };
  }

  protected async getEntity(findOptions: FindOne<IFindOptionsProps>): Promise<Result<E>> {
    return Result.ok(await this.entityRepository.findOne(findOptions));
  }

  public async execute(req: IByIdCommandProps): Promise<any> {
    const [cmdResult, taxonomyResult] = await Promise.all([this.createCommand(req), this.validateTaxonomies(req)]);

    const inputValidationResult = Result.combine([cmdResult, taxonomyResult]);

    if (inputValidationResult.isFailure) {
      return left(new InvalidParameterError(Result.combineForError(inputValidationResult)));
    }
    const byIdCmd: ByIdCommand<IByIdCommandProps> = cmdResult.getValue();

    const findOptionsResult: Result<F> = this.getFindOptions(byIdCmd);
    if (findOptionsResult.isFailure) {
      return left(new UnexpectedError(findOptionsResult.errorValue()));
    }
    const findOptions: F = findOptionsResult.getValue();

    const entityResult = await this.getEntity(findOptionsResult.getValue());
    if (entityResult.isFailure) {
      return left(new UnexpectedError(entityResult.errorValue()));
    }
    this.entity = entityResult.getValue();
    if (!this.entity) {
      return left(new NotFoundError(`Entity ${byIdCmd.id} was not found`));
    }

    return right(Result.ok<O>(await this.mapper.getFromModel(this.entity, this.getMapperOptions(findOptions))));
  }
}

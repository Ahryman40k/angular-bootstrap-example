import { IBaseRepository } from '../../repositories/core/baseRepository';
import { GenericEntity } from '../domain/genericEntity';
import { FromModelToDtoMappings } from './fromModelToDtoMappings';

export abstract class FromIdToDtoMappings<
  TId,
  TModel extends GenericEntity<any>,
  TDto,
  TOptions
> extends FromModelToDtoMappings<TModel, TDto, TOptions> {
  private readonly _repository: IBaseRepository<TModel, any>;

  constructor(repository: IBaseRepository<TModel, any>) {
    super();
    this._repository = repository;
  }

  public async getById(id: string, options?: TOptions): Promise<TDto> {
    const model = await this._repository.findById(`${id}`);
    return this.getFromModel(model, options);
  }
  public async getByIds(ids: string[], options?: TOptions): Promise<TDto[]> {
    return Promise.all(ids.map(id => this.getById(id, options)));
  }
}

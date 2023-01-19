import { isEmpty, uniq } from 'lodash';

export interface IMapperOptions {
  expand?: string[];
  fields?: string[];
}

/**
 * Use to map domain class to open-api output object.
 * @param TModel  Domain model class type.
 * @param TDto Open-api output object type.
 * @param TOptions Options needed to map from domain class to open-api object. It can be void if no option is necessary.
 */
export abstract class FromModelToDtoMappings<TModel, TDto, TOptions> {
  public async getFromModels(models: TModel[], options?: TOptions): Promise<TDto[]> {
    if (!models) {
      return undefined;
    }
    return Promise.all(models.map(model => this.getFromModel(model, options)));
  }

  public async getFromModel(model: TModel, options?: TOptions): Promise<TDto> {
    if (!model) {
      return undefined;
    }
    return this.getFromNotNullModel(model, options);
  }

  protected abstract getFromNotNullModel(model: TModel, options: TOptions): Promise<TDto>;

  // When a field in query is from a sub object eg: programBooks.name
  protected getOptionsNestedFields(fields: string[], nestedKey: string, getRootField = false): string[] {
    let results: string[] = [];
    if (!isEmpty(fields)) {
      // get only fields that match the nestedKey
      const innerFields = fields.filter(f => f.includes(nestedKey));

      results = uniq(
        innerFields.map(field => {
          // split between nestedKey field (first), and rest of subNestedFields
          const [first, ...rest] = field.split('.');
          if (getRootField) {
            return first;
          }
          return rest.join('.');
        })
      );
    }
    return results;
  }
}

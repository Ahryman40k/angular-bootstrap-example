import { ErrorCodes, IApiError, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { get } from 'lodash';

import { ITaxonomyGroupCode } from '../../../models/taxonomies/taxonomyGroupCode';
import { createDuplicateError } from '../../../shared/domainErrors/customApiErrors';
import { enumValues } from '../../../utils/enumUtils';
import { createInvalidInputError, INVALID_INPUT_ERROR_MESSAGE } from '../../../utils/errorUtils';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { taxonomyService } from '../taxonomyService';

export interface ITaxonomyValidation {
  param: string;
  taxonomyGroup: string;
  optionnal: boolean;
}

class TaxonomyValidator {
  public async validate(
    errors: IApiError[],
    taxonomyGroup: TaxonomyGroup,
    value: string | string[],
    target?: string
  ): Promise<void> {
    const taxonomies = await taxonomyService.all();
    const group = taxonomies.filter(t => t.group === taxonomyGroup);

    const values = value instanceof Array ? value : [value];
    const invalidValues = values.filter(v => !group.find(t => t.code === v));

    for (const invalidValue of invalidValues) {
      errors.push({
        target,
        code: ErrorCodes.Taxonomy,
        message: `Taxonomy code: '${invalidValue}' is invalid for taxonomy group: '${taxonomyGroup}'`
      });
    }
  }

  public async validatePost(taxonomy: ITaxonomy): Promise<void> {
    const errors: IApiError[] = [];
    const groupCode: ITaxonomyGroupCode = {
      group: taxonomy.group,
      code: taxonomy.code
    };
    await openApiInputValidator.validateInputModel(errors, 'Taxonomy', taxonomy, false);
    this.validateGroupCode(errors, groupCode);
    if (errors?.length) {
      throw createInvalidInputError(INVALID_INPUT_ERROR_MESSAGE, errors);
    }
    await this.validateUniqueGroupCode(errors, groupCode);
    if (errors?.length) {
      throw createDuplicateError('The input is a duplicate.', null, errors);
    }
  }

  public async validateUpdate(groupCode: ITaxonomyGroupCode, taxonomy: ITaxonomy): Promise<void> {
    const errors: IApiError[] = [];
    await openApiInputValidator.validateInputModel(errors, 'Taxonomy', taxonomy, false);
    this.validateGroupCode(errors, groupCode);
    if (errors?.length) {
      throw createInvalidInputError(INVALID_INPUT_ERROR_MESSAGE, errors);
    }
  }

  public validateDelete(groupCode: ITaxonomyGroupCode): void {
    const errors: IApiError[] = [];
    this.validateGroupCode(errors, groupCode);
    if (errors?.length) {
      throw createInvalidInputError(INVALID_INPUT_ERROR_MESSAGE, errors);
    }
  }

  public validateValues<O>(
    objectToValidate: O,
    objectProperties: ITaxonomyValidation[],
    taxonomies: ITaxonomy[]
  ): IApiError[] {
    const errors: IApiError[] = [];
    for (const property of objectProperties) {
      const objectPropertyValue = get(objectToValidate, property.param);
      if (!property.optionnal || objectPropertyValue) {
        const getTaxonomy = taxonomies.find(
          taxonomy => taxonomy.group === property.taxonomyGroup && taxonomy.code === objectPropertyValue
        );
        if (getTaxonomy === undefined && objectPropertyValue !== undefined) {
          errors.push({
            code: ErrorCodes.InvalidInput,
            message: `Taxonomy code: ${objectPropertyValue} doesn't exist`,
            target: property.param
          });
        }
      }
    }
    return errors;
  }

  private validateGroupCode(errors: IApiError[], groupCode: ITaxonomyGroupCode): void {
    if (!/\w+/.test(groupCode?.group)) {
      errors.push({
        code: ErrorCodes.InvalidInput,
        message: 'The taxonomy group is invalid. It must be alphanumeric.'
      });
    }
    if (!/\w+/.test(groupCode?.code)) {
      errors.push({
        code: ErrorCodes.InvalidInput,
        message: 'The taxonomy code is invalid. It must be alphanumeric.'
      });
    }
    if (!enumValues(TaxonomyGroup).includes(groupCode?.group)) {
      errors.push({
        code: ErrorCodes.InvalidInput,
        message: 'The taxonomy group is invalid. It must be an existing group.'
      });
    }
  }

  private async validateUniqueGroupCode(errors: IApiError[], groupCode: ITaxonomyGroupCode): Promise<void> {
    const taxonomy = await taxonomyService.getTaxonomy(groupCode.group as TaxonomyGroup, groupCode.code);
    if (taxonomy) {
      errors.push({
        code: ErrorCodes.Duplicate,
        message: `A taxonomy already exist with the code ${groupCode.code} within the group ${groupCode.group}`
      });
    }
  }
}

export const taxonomyValidator = new TaxonomyValidator();

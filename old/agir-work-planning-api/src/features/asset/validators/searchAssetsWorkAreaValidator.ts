import { IApiError, IAssetsWorkAreaSearchRequest, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib';
import { get, isEmpty } from 'lodash';

import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';

export class SearchAssetsWorkAreaValidator {
  public static async validateAgainstOpenApi(
    assetsWorkAreaSearchRequestInput: IAssetsWorkAreaSearchRequest
  ): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel('AssetsWorkAreaSearchRequest', assetsWorkAreaSearchRequestInput);
  }

  public static async validateTaxonomy(assetType: string): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];

    const assetTaxonomyProperties: { param: string; taxonomyGroup: TaxonomyGroup; optionnal: boolean }[] = [
      { param: 'assetType', taxonomyGroup: TaxonomyGroup.assetType, optionnal: false }
    ];

    for (const property of assetTaxonomyProperties) {
      const objectPropertyValue = get(assetType, property.param);
      if (!property.optionnal || objectPropertyValue) {
        await taxonomyValidator.validate(errorDetails, property.taxonomyGroup, objectPropertyValue);
      }
    }
    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }
}

import {
  ErrorCodes,
  IAssetsLastInterventionSearchRequest,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { IApiError } from '@villemontreal/core-utils-general-nodejs-lib/dist/src';
import { isEmpty, isNil } from 'lodash';

import { Guard } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { TaxonomyFindOptions } from '../../taxonomies/models/taxonomyFindOptions';
import { taxonomyRepository } from '../../taxonomies/mongo/taxonomyRepository';
import { ITaxonomyValidation, taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';

export class SearchAssetsLastInterventionValidator {
  public static async validateAgainstOpenApi(
    assetsLastInterventionSearchRequestInput: IAssetsLastInterventionSearchRequest
  ): Promise<Result<any>> {
    return openApiInputValidator.validateOpenApiModel(
      'AssetsLastInterventionSearchRequest',
      assetsLastInterventionSearchRequestInput
    );
  }

  public static async validateTaxonomy(
    assetsLastInterventionSearchRequestInput: IAssetsLastInterventionSearchRequest
  ): Promise<Result<any>> {
    const errorDetails: IApiError[] = [];
    const taxonomiesFindOptions = TaxonomyFindOptions.create({
      criterias: {
        group: TaxonomyGroup.externalReferenceType
      }
    }).getValue();
    const taxonomies: ITaxonomy[] = await taxonomyRepository.findAll(taxonomiesFindOptions);

    if (
      !isNil(assetsLastInterventionSearchRequestInput.assetExternalReferenceIds) &&
      Array.isArray(assetsLastInterventionSearchRequestInput.assetExternalReferenceIds)
    ) {
      const assetsLastInterventionSearchRequestTaxonomyProperties: ITaxonomyValidation[] = assetsLastInterventionSearchRequestInput.assetExternalReferenceIds.map(
        (assetExternalReferenceId, idx) => {
          return {
            param: `assetExternalReferenceIds[${idx}].type`,
            taxonomyGroup: TaxonomyGroup.externalReferenceType,
            optionnal: false
          };
        }
      );
      errorDetails.push(
        ...taxonomyValidator.validateValues(
          assetsLastInterventionSearchRequestInput,
          assetsLastInterventionSearchRequestTaxonomyProperties,
          taxonomies
        )
      );
    }

    if (!isEmpty(errorDetails)) {
      return Result.combine(
        errorDetails.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCodes, error.message));
        })
      );
    }

    return Result.ok();
  }
}

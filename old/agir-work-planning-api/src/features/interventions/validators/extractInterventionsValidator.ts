import {
  IApiError,
  InterventionsExtractionSelectableFields as SelectableFields,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { BaseExtractionValidator } from '../../../shared/extraction/baseExtractionValidator';
import { IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { IExtractInterventionsCommandProps } from '../useCases/extract/extractInterventionsCommand';

export class ExtractInterventionsValidator extends BaseExtractionValidator {
  public static async validateAgainstOpenApi(props: IExtractInterventionsCommandProps): Promise<Result<IGuardResult>> {
    return openApiInputValidator.validateOpenApiModel('InterventionExtractSearchRequest', props);
  }

  public static async validateAgainstTaxonomies(
    props: IExtractInterventionsCommandProps
  ): Promise<Result<IGuardResult>> {
    const errors: IApiError[] = [];
    if (props.programId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.programType, props.programId, 'programId');
    }
    if (props.interventionTypeId) {
      await taxonomyValidator.validate(
        errors,
        TaxonomyGroup.interventionType,
        props.interventionTypeId,
        'interventionTypeId'
      );
    }
    if (props.workTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.workType, props.workTypeId, 'workTypeId');
    }
    if (props.requestorId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.requestor, props.requestorId, 'requestorId');
    }
    if (props.boroughId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.borough, props.boroughId, 'boroughId');
    }
    if (props.decisionTypeId) {
      await taxonomyValidator.validate(
        errors,
        TaxonomyGroup.interventionDecisionType,
        props.decisionTypeId,
        'decisionTypeId'
      );
    }
    if (props.status) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.interventionStatus, props.status, 'status');
    }
    if (props.executorId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.executor, props.executorId, 'executorId');
    }
    if (props.medalId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.medalType, props.medalId, 'medalId');
    }
    if (props.assetTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.assetType, props.assetTypeId, 'assetTypeId');
    }
    return this.mapErrorsToGuardResult(errors);
  }

  public static async validatePermissionsForRestrictedFields(selectedFields: string[]): Promise<Result<IGuardResult>> {
    const errors: IApiError[] = [];
    this.validatePermissionForField(selectedFields, SelectableFields.requirements, Permission.REQUIREMENT_READ, errors);
    return this.mapErrorsToGuardResult(errors);
  }
}

import {
  IApiError,
  Permission,
  ProjectsExtractionSelectableFields as SelectableFields,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { BaseExtractionValidator } from '../../../shared/extraction/baseExtractionValidator';
import { IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { IExtractProjectsCommandProps } from '../useCases/extract/extractProjectsCommand';

export class ExtractProjectsValidator extends BaseExtractionValidator {
  public static async validateAgainstOpenApi(props: IExtractProjectsCommandProps): Promise<Result<IGuardResult>> {
    return openApiInputValidator.validateOpenApiModel('ProjectExtractSearchRequest', props);
  }

  public static async validateAgainstTaxonomies(props: IExtractProjectsCommandProps): Promise<Result<IGuardResult>> {
    const errors: IApiError[] = [];
    if (props.projectTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectType, props.projectTypeId, 'projectTypeId');
    }
    if (props.executorId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.executor, props.executorId, 'executorId');
    }
    if (props.categoryId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectCategory, props.categoryId, 'categoryId');
    }
    if (props.subCategoryId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectSubCategory, props.subCategoryId, 'subCategoryId');
    }
    if (props.boroughId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.borough, props.boroughId, 'boroughId');
    }
    if (props.status) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.projectStatus, props.status, 'status');
    }
    if (props.workTypeId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.workType, props.workTypeId, 'workTypeId');
    }
    if (props.medalId) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.medalType, props.medalId, 'medalId');
    }
    return this.mapErrorsToGuardResult(errors);
  }

  public static async validatePermissionsForRestrictedFields(selectedFields: string[]): Promise<Result<IGuardResult>> {
    const errors: IApiError[] = [];
    this.validatePermissionForField(selectedFields, SelectableFields.requirements, Permission.REQUIREMENT_READ, errors);
    this.validatePermissionForField(
      selectedFields,
      SelectableFields.annualPeriodsProgramBookId,
      Permission.PROGRAM_BOOK_READ,
      errors
    );
    this.validatePermissionForField(
      selectedFields,
      SelectableFields.designRequirements,
      Permission.SUBMISSION_READ,
      errors
    );
    return this.mapErrorsToGuardResult(errors);
  }
}

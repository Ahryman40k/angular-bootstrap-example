import { IApiError, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';

import { isEmpty } from 'lodash';
import { ErrorCode } from '../../../shared/domainErrors/errorCode';
import { Guard, IGuardResult } from '../../../shared/logic/guard';
import { Result } from '../../../shared/logic/result';
import { openApiInputValidator } from '../../../utils/openApiInputValidator';
import { taxonomyValidator } from '../../taxonomies/validators/taxonomyValidator';
import { IPlainDocumentProps } from '../models/plainDocument';

export class DocumentValidator {
  public static async validateAgainstOpenApi(documentInput: IPlainDocumentProps): Promise<Result<IGuardResult>> {
    return openApiInputValidator.validateOpenApiModel('PlainDocument', documentInput);
  }

  public static async validateTaxonomies(plainDocument: IPlainDocumentProps): Promise<Result<IGuardResult>> {
    const errors: IApiError[] = [];
    if (plainDocument.type) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.documentType, plainDocument.type);
    }
    if (plainDocument.validationStatus) {
      await taxonomyValidator.validate(errors, TaxonomyGroup.documentStatus, plainDocument.validationStatus);
    }
    if (!isEmpty(errors)) {
      return Result.combine(
        errors.map(error => {
          return Result.fail(Guard.error(error.target, error.code as ErrorCode, error.message));
        })
      );
    }
    return Result.ok();
  }
}
export const documentValidator = new DocumentValidator();

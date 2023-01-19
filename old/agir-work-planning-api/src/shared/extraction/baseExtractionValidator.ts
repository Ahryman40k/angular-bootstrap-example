import { ErrorCodes, IApiError, Permission } from '@villemontreal/agir-work-planning-lib';
import { isEmpty } from 'lodash';
import { userService } from '../../services/userService';
import { enumValues } from '../../utils/enumUtils';
import { ErrorCode } from '../domainErrors/errorCode';
import { Guard, IGuardResult } from '../logic/guard';
import { Result } from '../logic/result';

export abstract class BaseExtractionValidator {
  public static async validateSelectedFields(
    selectedFields: string[],
    selectableFields: string[]
  ): Promise<Result<IGuardResult>> {
    const errors: IApiError[] = [];

    for (const field of selectedFields) {
      if (!selectableFields.includes(field)) {
        errors.push({
          code: ErrorCodes.InvalidInput,
          message: `'${field}' is not a selectable field`,
          target: `fields`
        });
      }
    }

    return this.mapErrorsToGuardResult(errors);
  }

  protected static mapErrorsToGuardResult(errors: IApiError[]): Result<IGuardResult> {
    if (!isEmpty(errors)) {
      return Result.combine(
        errors.map(error => {
          return Result.fail(
            Guard.error(
              error.target,
              enumValues(ErrorCode).includes(error.code) ? (error.code as ErrorCode) : (error.code as ErrorCodes),
              error.message
            )
          );
        })
      );
    }
    return Result.ok();
  }

  protected static validatePermissionForField(
    selectedFields: string[],
    field: string,
    permission: Permission,
    errors: IApiError[]
  ) {
    if (selectedFields.includes(field) && !userService.currentUser.hasPermission(permission)) {
      errors.push({
        code: ErrorCode.FORBIDDEN,
        message: `The '${permission}' permission is required to select the '${field}' field`,
        target: `fields`
      });
    }
  }
}

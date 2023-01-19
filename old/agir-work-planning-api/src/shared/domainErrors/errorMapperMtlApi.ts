import { isEmpty } from 'lodash';
import {
  createForbiddenError,
  createInvalidParameterError,
  createNotFoundError,
  createServerError,
  IApiError,
  IApiErrorAndInfo,
  LogLevel
} from '../../utils/utils';
import { IGuardResult } from '../logic/guard';
import { AlreadyExistsError } from './alreadyExistsError';
import { createDuplicateError, createTransitionError, createUnprocessableEntityError } from './customApiErrors';
import { ForbiddenError } from './forbiddenError';
import { IApiErrorMapper } from './iApiErrorMapper';
import { InvalidParameterError } from './invalidParameterError';
import { NotFoundError } from './notFoundError';
import { StateTransitionError } from './StateTransitionError';
import { UnprocessableEntityError } from './unprocessableEntityError';

export class ErrorMapperMtlApi implements IApiErrorMapper<IApiErrorAndInfo> {
  public toApiError(error: any): IApiErrorAndInfo {
    const apiErrors: IApiError[] = [];
    const errorObject = error.errorValue();
    const message: string = errorObject.message;
    const failures: IGuardResult[] = errorObject.error instanceof Array ? [...errorObject.error] : [errorObject.error];

    switch (error.constructor) {
      case InvalidParameterError:
        if (!isEmpty(failures)) {
          failures.forEach((failure: any) => {
            apiErrors.push({
              code: failure.code,
              message: failure.message,
              target: failure.target
            });
          });
        }
        return createInvalidParameterError(message, apiErrors);
      case NotFoundError:
        return createNotFoundError(message, message, LogLevel.ERROR, false);
      case StateTransitionError:
        return createTransitionError(message, errorObject.error, undefined, LogLevel.ERROR, false);
      case ForbiddenError:
        return createForbiddenError(message, message);
      case AlreadyExistsError:
        return createDuplicateError(message, errorObject.error, undefined, LogLevel.ERROR, false);
      case UnprocessableEntityError:
        return createUnprocessableEntityError(message, errorObject.error, undefined, LogLevel.ERROR, false);
      default:
        return createServerError(JSON.stringify(errorObject.error), errorObject.message);
    }
  }
}

export const errorMtlMapper = new ErrorMapperMtlApi();

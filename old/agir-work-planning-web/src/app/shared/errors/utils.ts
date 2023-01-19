import { ErrorCodes, IApiError } from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, uniqBy } from 'lodash';
import { ErrorService, IErrorDictionary } from './error.service';

export function isApiErrorOf(e: any, ...errorCodes: ErrorCodes[]): boolean {
  return errorCodes.includes(e.error.error.details[0].code);
}

export function findMatchingErrors(e: any, errorCodes: ErrorCodes[]): IApiError[] {
  const error = e.error.error;
  const errors: IApiError[] = [];
  if (!isEmpty(error.details)) {
    errors.push(...error.details.filter(detail => errorCodes.includes(detail?.code)));
  }
  if (!isEmpty(error.target)) {
    if (Array.isArray(error.target)) {
      errors.push(...error.target.filter(target => errorCodes.includes(target?.code)));
    } else {
      if (errorCodes.includes(error.target.code)) {
        errors.push(error.target);
      }
    }
  }
  return errors.filter(err => err);
}

export function apiErrorsToDictionaryError(
  e: any,
  errorsService: ErrorService,
  errorCodes: ErrorCodes[]
): IErrorDictionary[] {
  const matchingErrors = findMatchingErrors(e, errorCodes);
  if (isEmpty(matchingErrors)) {
    return [];
  }
  return uniqBy(
    matchingErrors.map(err => {
      return {
        code: err.code,
        key: null,
        value: () => errorsService.findInDictionary(err.code, '')
      };
    }),
    (err: any) => {
      return err.value();
    }
  );
}

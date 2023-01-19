import { ApiErrorAndInfo, createError, IApiError, LogLevel } from '@villemontreal/core-utils-general-nodejs-lib';
import * as HttpStatusCodes from 'http-status-codes';

/**
 * creates a duplicate Error
 *
 * @param logMessage The message to log.
 * @param publicMessage The message to return in the error.
 * @param logLevel The log level to use.
 * @param logStackTrace Should the stack trace be logged?
 */
export function createDuplicateError(
  publicMessage = 'Duplicate',
  target?: string,
  details: IApiError[] = [],
  logLevel: LogLevel = LogLevel.ERROR,
  logStackTrace = false
): ApiErrorAndInfo {
  return createError('DuplicateError', publicMessage)
    .httpStatus(HttpStatusCodes.CONFLICT)
    .publicMessage(publicMessage)
    .details(details)
    .logLevel(logLevel)
    .logStackTrace(logStackTrace)
    .target(target)
    .build();
}

/**
 * creates a unprocessable entity Error
 *
 * @param logMessage The message to log.
 * @param publicMessage The message to return in the error.
 * @param logLevel The log level to use.
 * @param logStackTrace Should the stack trace be logged?
 */
export function createUnprocessableEntityError(
  publicMessage = 'Unprocessable Entity',
  target?: string,
  details: IApiError[] = [],
  logLevel: LogLevel = LogLevel.ERROR,
  logStackTrace = false
): ApiErrorAndInfo {
  return createError('unprocessableEntity', publicMessage)
    .httpStatus(HttpStatusCodes.UNPROCESSABLE_ENTITY)
    .publicMessage(publicMessage)
    .details(details)
    .logLevel(logLevel)
    .logStackTrace(logStackTrace)
    .target(target)
    .build();
}

export function createTransitionError(
  publicMessage = 'Transition forbidden',
  target?: string,
  details: IApiError[] = [],
  logLevel: LogLevel = LogLevel.ERROR,
  logStackTrace = false
): ApiErrorAndInfo {
  return createError('Transition forbidden', publicMessage)
    .httpStatus(HttpStatusCodes.CONFLICT)
    .publicMessage(publicMessage)
    .details(details)
    .logLevel(logLevel)
    .logStackTrace(logStackTrace)
    .target(target)
    .build();
}

export function createConflictError(
  publicMessage = 'Conflict error',
  errorCode?: string,
  target?: string,
  details: IApiError[] = [],
  logLevel: LogLevel = LogLevel.ERROR,
  logStackTrace = false
): ApiErrorAndInfo {
  return createError(`${errorCode}`, publicMessage)
    .httpStatus(HttpStatusCodes.CONFLICT)
    .publicMessage(publicMessage)
    .details(details)
    .logLevel(logLevel)
    .logStackTrace(logStackTrace)
    .target(target)
    .build();
}

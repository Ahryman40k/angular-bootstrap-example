import * as HttpStatusCodes from 'http-status-codes';

import { ApiErrorAndInfo, createError, globalConstants, IApiError, LogLevel } from './utils';

export const INVALID_INPUT_ERROR_MESSAGE = 'The input is invalid.';
export function createInvalidInputError(
  publicMessage: string,
  details: IApiError[] = [],
  logLevel: LogLevel = LogLevel.ERROR,
  logStackTrace = true
): ApiErrorAndInfo {
  return createError(globalConstants.errors.apiGeneralErrors.codes.INVALID_PARAMETER, publicMessage)
    .httpStatus(HttpStatusCodes.BAD_REQUEST)
    .publicMessage(publicMessage)
    .details(details)
    .logLevel(logLevel)
    .logStackTrace(logStackTrace)
    .build();
}

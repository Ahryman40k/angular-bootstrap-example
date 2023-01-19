import {
  createNotFoundError,
  IApiError,
  IApiErrorAndInfo,
  IErrorResponse,
  isApiError,
  isApiErrorAndInfo,
  isErrorBuilder
} from '@villemontreal/core-utils-general-nodejs-lib';
import * as autobind from 'autobind-decorator';
import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';
import * as _ from 'lodash';

import { configs } from '../../../config/configs';
import { constants, globalConstants } from '../../../config/constants';
import { createLogger, LogLevel } from '../../utils/logger';

const logger = createLogger('errorController');

const updateToLogObject = (err: any, logStackTrace: boolean, toLog: any): any => {
  let toLogFixed = toLog;
  if (_.isObject(err) && (err as any).stack && logStackTrace) {
    if (!_.isObject(toLog)) {
      toLogFixed = {
        msg: toLog
      };
    }
    if (!('stack' in toLogFixed)) {
      toLogFixed.stack = (err as any).stack;
    }
  }
  return toLogFixed;
};

/**
 * Error controller
 */
@autobind
export class ErrorController {
  /**
   * Manages thrown errors
   */
  public genericErrorHandler(err: any, req: express.Request, res: express.Response, next: express.NextFunction) {
    // ==========================================
    // Default values
    // ==========================================
    let logLevel: LogLevel = LogLevel.ERROR;
    let logStackTrace = true;
    let httpStatus: number = HttpStatusCodes.INTERNAL_SERVER_ERROR;
    let apiError: IApiError = {
      code: globalConstants.errors.apiGeneralErrors.codes.GENERIC_ERROR,
      message: 'An error occured'
    };

    let toLog: any = err;

    // ==========================================
    // If the error we received implements IApiErrorAndInfo,
    // we have extra informations on how to manage
    // it.
    // ==========================================
    if (isApiErrorAndInfo(err)) {
      const apiErrorCustom: IApiErrorAndInfo = err;

      toLog = apiErrorCustom.logMessage;

      apiError = this.getApiError(apiError, apiErrorCustom);
      logLevel = this.getLogLevel(apiErrorCustom);
      logStackTrace = this.getLogStackTrace(apiErrorCustom);
      httpStatus = this.getHttpStatus(apiErrorCustom);
    } else if (isApiError(err)) {
      // ==========================================
      // We may also simply have received an IApiError,
      // directly.
      // ==========================================
      toLog = err;
      apiError = err;
    } else if (isErrorBuilder(err)) {
      logger.error(
        "An ErrorBuilder has been received as an error! You probably forgot to call '.build()' when creating the error."
      );
    }

    toLog = updateToLogObject(err, logStackTrace, toLog);

    // ==========================================
    // Logs the error
    // ==========================================
    logger.log(logLevel, toLog);

    // ==========================================
    // Headers already sent, we souldn't send anything
    // more.
    // ==========================================
    if (res.headersSent) {
      return next(err);
    }

    // ==========================================
    // On a dev environment, we can add the stack
    // trace to the public message.
    // ==========================================
    apiError.message = this.getApiErrorMessage(apiError, err);

    // ==========================================
    // Creates the IErrorResponse object to
    // return.
    // ==========================================
    const errorResponse: IErrorResponse = {
      error: apiError
    };

    res.setHeader('content-type', constants.mediaTypes.JSON);
    res.status(httpStatus);
    res.send(JSON.stringify(errorResponse));
  }

  /**
   * On a dev environment, we can add the stack
   * trace to the public message.
   * @param apiError
   * @param apiErrorCustom
   * @returns
   */
  private getApiError(apiError: IApiError, apiErrorCustom: IApiErrorAndInfo): IApiError {
    if (!apiErrorCustom.error) {
      return apiError;
    }
    return apiErrorCustom.error;
  }

  private getLogLevel(apiErrorCustom: IApiErrorAndInfo): LogLevel {
    if (apiErrorCustom.logLevel === undefined) {
      return LogLevel.ERROR;
    }
    return apiErrorCustom.logLevel;
  }

  private getLogStackTrace(apiErrorCustom: IApiErrorAndInfo): boolean {
    if (apiErrorCustom.logStackTrace === undefined) {
      return true;
    }
    return apiErrorCustom.logStackTrace;
  }

  private getHttpStatus(apiErrorCustom: IApiErrorAndInfo): number {
    if (!apiErrorCustom.httpStatus) {
      return HttpStatusCodes.INTERNAL_SERVER_ERROR;
    }
    return apiErrorCustom.httpStatus;
  }

  private getApiErrorMessage(apiError: IApiError, err: any): string {
    if (!configs.environment.isLocalOrDev && !configs.logging.addStackTraceToErrorMessagesInDev) {
      return apiError.message;
    }
    return `${apiError.message || ''}\n${err.stack || '[no stack trace available]'}`;
  }

  /**
   * Manages "Resource Not Found" errors. This is going to be called by
   * the web framework when no other route matches.
   */
  public notFoundErrorHandler(req: express.Request, res: express.Response, next: express.NextFunction) {
    this.genericErrorHandler(
      createNotFoundError(`Resource not found : ${req.url}`, 'Resource not found', LogLevel.DEBUG, false),
      req,
      res,
      next
    );
  }
}
export const errorController: ErrorController = new ErrorController();

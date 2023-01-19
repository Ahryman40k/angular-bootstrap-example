import * as express from 'express';
import * as HttpStatusCodes from 'http-status-codes';

import { errorController } from '../controllers/core/errorController';
import { createLogger, LogLevel } from '../utils/logger';

const logger = createLogger('errorManagement');

let unhandledRejectionHandlerRegistered = false;
let uncaughtExceptionHandlerRegistered = false;

/**
 * Adds error handlers.
 *
 * This function *must* be called after the regular routes
 * gave been added!
 */
export function addErrorHandlers(app: express.Express) {
  // ==========================================
  // 404 / Not Found route
  // ==========================================
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    errorController.notFoundErrorHandler(req, res, next);
  });

  // ==========================================
  // Generic Server error handler
  // ==========================================
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      errorController.genericErrorHandler(err, req, res, next);
    } catch (err2) {
      try {
        res.statusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR;
        res.send('An error occured.');
        logger.error('Error while managing an error : ' + err2);
      } catch (err3) {
        // too bad!
      }
    }
  });

  // ==========================================
  // Registers a unhandled promises rejections
  // handler
  // ==========================================
  registerUnhandledRejectionHandler();

  // ==========================================
  // Registers a uncaught exceptions handler
  // ==========================================
  registerUncaughtExceptionHandler();
}

/**
 * Adds an handler for a unhandled promises rejections
 * and makes sure the handler is only registered one time.
 */
export function registerUnhandledRejectionHandler() {
  if (unhandledRejectionHandlerRegistered) {
    return;
  }
  unhandledRejectionHandlerRegistered = true;

  process.on('unhandledRejection', (reason: any, p: any) => {
    logger.log(
      LogLevel.ERROR,
      reason,
      "unhandledRejection. This means no-floating-promises rule is not respected. If you don' want to await a promise, consider using /utils/fireAndForget."
    );
  });
}

/**
 * Adds an handler for uncaught exceptions
 * and makes sure the handler is only registered one time.
 *
 * If you are thinking about modifying this function,
 * make sure you read :
 * https://nodejs.org/api/process.html#process_warning_using_uncaughtexception_correctly
 *
 */
export function registerUncaughtExceptionHandler() {
  if (uncaughtExceptionHandlerRegistered) {
    return;
  }
  uncaughtExceptionHandlerRegistered = true;

  process.on('uncaughtException', (err: any) => {
    try {
      logger.error('An uncaught exception occured : ' + err);
    } finally {
      process.exit(1);
    }
  });
}

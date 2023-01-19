import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandler, Injectable, Injector, NgZone } from '@angular/core';
import { Router } from '@angular/router';

import { DIALOG_SERVICE_DISMISS } from '../dialogs/dialogs.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ErrorService } from './error.service';
import { LoggingService } from './logging.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  // Error handling is important and needs to be loaded first in Angular.
  // Because of this we must manually inject the services with Injector.
  constructor(private readonly injector: Injector) {}

  /**
   * Handles all global errors.
   *
   * @param e thrown error
   */
  public handleError(e: any): void {
    let error = e;
    // Retrieves dependencies from the injector.
    const errorService = this.injector.get(ErrorService);
    const logger = this.injector.get(LoggingService);
    const notificationsService = this.injector.get(NotificationsService);
    const ngZone = this.injector.get(NgZone);

    let messages: string[];

    if (error.rejection) {
      // Means it comes from a Promise rejection, then the rejection property will contain the error.
      error = error.rejection;
    }

    if (!this.shouldHandleError(error)) {
      return;
    }

    if (error instanceof HttpErrorResponse) {
      // Server Error
      messages = errorService.getServerMessages(error);
    } else {
      // Client Error
      messages = [errorService.getClientMessage(error)];
    }

    // Shows error
    ngZone.run(() => {
      // Need to run in zone because `handleError` is sometimes called outside of it.
      for (const errorMessage of messages) {
        notificationsService.showError(errorMessage);
      }
    });

    // Always log errors
    logger.logError(error);
  }

  private shouldHandleError(error: any): boolean {
    if (error?.status === 404) {
      const ngZone = this.injector.get(NgZone);
      ngZone.run(() => {
        void this.injector.get(Router).navigate(['/not-found']);
      });
      return false;
    }
    const errorString = (error.message || error.toString()) as string;
    const ignoreStrings = [DIALOG_SERVICE_DISMISS];
    return !ignoreStrings.some(ignoreString => errorString.includes(ignoreString));
  }
}

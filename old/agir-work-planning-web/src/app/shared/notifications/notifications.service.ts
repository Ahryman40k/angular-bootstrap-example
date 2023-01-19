import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

import { INotificationAlert, NotificationAlertType } from './notification-alert';

const DEFAULT_TIMEOUT = environment.services.notifications.timeouts.default;
const SUCCESS_TIMEOUT = environment.services.notifications.timeouts.success;
const WARNING_TIMEOUT = environment.services.notifications.timeouts.warning;

/**
 * Service that takes care of handling the notifications throughout the application.
 * Can show or close notifications.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  /**
   * Keep a list of notifications in memory.
   */
  public notifications: INotificationAlert[] = [];

  /**
   * Shows a notification
   * @param message The message to be displayed
   * @param type The type of the notification
   */
  public show(message: string, type: NotificationAlertType, timeout: number = DEFAULT_TIMEOUT): void {
    if (this.notifications.some(x => x.message === message && x.type === type)) {
      return;
    }
    const notificationAlert: INotificationAlert = { message, type };
    this.notifications.push(notificationAlert);
    if (timeout) {
      setTimeout(() => {
        this.close(notificationAlert);
      }, timeout);
    }
  }

  /**
   * Shows a warning notification
   * @param message The message to be displayed
   */
  public showWarning(message: string): void {
    this.show(message, NotificationAlertType.warning, WARNING_TIMEOUT);
  }

  /**
   * Shows an error notification
   * @param message The message to be displayed
   */
  public showError(message: string): void {
    this.show(message, NotificationAlertType.danger);
  }

  /**
   * Shows success message notification
   * @param message
   */
  public showSuccess(message: string): void {
    this.show(message, NotificationAlertType.success, SUCCESS_TIMEOUT);
  }

  /**
   * Closes a notification
   * @param notification The notification to be closed
   */
  public close(notification: INotificationAlert): void {
    const i = this.notifications.indexOf(notification);
    if (i > -1) {
      this.notifications.splice(i, 1);
    }
  }
}

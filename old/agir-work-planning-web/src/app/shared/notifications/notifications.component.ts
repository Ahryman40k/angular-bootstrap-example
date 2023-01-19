import { Component } from '@angular/core';

import { INotificationAlert } from './notification-alert';
import { NotificationsService } from './notifications.service';

/**
 * Component that displays the application notifications.
 */
@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss']
})
export class NotificationsComponent {
  /**
   * Gets all the notifications and reverses the list.
   */
  public get notifications(): INotificationAlert[] {
    return this.notificationsService.notifications.slice().reverse();
  }

  constructor(private readonly notificationsService: NotificationsService) {}

  public close(notification: INotificationAlert): void {
    this.notificationsService.close(notification);
  }
}

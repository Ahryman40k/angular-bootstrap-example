import { Component, Input } from '@angular/core';
import { NotificationAlertType } from '../notifications/notification-alert';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent {
  @Input() public type: NotificationAlertType;
}

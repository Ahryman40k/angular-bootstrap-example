export enum NotificationAlertType {
  success = 'success',
  warning = 'warning',
  danger = 'danger'
}

export interface INotificationAlert {
  message: string;
  type: NotificationAlertType;
}

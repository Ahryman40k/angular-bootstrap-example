import { CommonModule } from '@angular/common';
import {
  Component,
  Directive,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

/**
 * Content of an alert, intended for use within `<vdm-alert>`. This component is an optional
 * convenience for use with other convenience elements, such as `<vdm-alert-title>`; any custom
 * content block element may be used in its place.
 *
 * AlertContent provides no behaviors, instead serving as a purely visual treatment.
 */

/**
 * Title of an alert, intended for use within `<vdm-alert>`. This component is an optional
 * convenience for one variety of alert title; any custom title element may be used in its place.
 *
 * AlertTitle provides no behaviors, instead serving as a purely visual treatment.
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-alert-title',
  standalone: true,
})
export class AlertTitleDirective {
  @HostBinding('class') hostClass = 'vdm-alert-title';
}

/**
 * Content of an alert, intended for use within `<vdm-alert>`. This component is an optional
 * convenience for use with other convenience elements, such as `<vdm-alert-title>`; any custom
 * content block element may be used in its place.
 *
 * AlertContent provides no behaviors, instead serving as a purely visual treatment.
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-alert-content',
  standalone: true,
})
export class AlertContentDirective {
  @HostBinding('class') hostClass = 'vdm-alert-content';
}

/**
 * Bottom area of an alert that contains action buttons, intended for use within `<vdm-alert>`.
 * This component is an optional convenience for use with other convenience elements, such as
 * `<vdm-alert-content>`; any custom action block element may be used in its place.
 *
 * AlertActions provides no behaviors, instead serving as a purely visual treatment.
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-alert-actions',
  exportAs: 'AlertActions',
  standalone: true,
})
export class AlertActionsDirective {
  @HostBinding('class') hostClass = 'vdm-alert-actions';
}

/**
 * Link inside an alert message, intended for use within `<vdm-alert>`.
 * This component is an optional convenience for use with other convenience elements, such as
 * `<vdm-alert-content>`; any custom action block element may be used in its place.
 *
 * AlertLink provides no behaviors, instead serving as a purely visual treatment.
 */
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-alert-link',
  standalone: true,
})
export class AlertLinkDirective {
  @HostBinding('class') hostClass = 'vdm-alert-link';
}

const typesAlertIcon = {
  success: {icon: 'icon-check-circle', title: 'Succès' },
  danger: {icon: 'icon-error', title: 'Erreur' },
  warning: {icon: 'icon-warning', title: 'Attention' },
  emergency: {icon: 'icon-emergency', title: 'Urgence' },
  info: {icon: 'icon-info', title: 'Information' },
  default: {icon: 'icon-info', title: 'Information' },
};

export type AlertKind = typeof typesAlertIcon;


/**
 *  alert component. Alerts should be used when the message concerns an
 * external subject or a part of the page
 *
 * See https://zeroheight.com/575tugn0n/p/03c51f-messages-dalerte/t/80b47c
 *
 * AlertComponent provides no behaviors, instead serving as a purely visual treatment.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-alert',
  templateUrl: './alert.component.html',
  styleUrls: ['./alert.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [
    CommonModule,
    IconComponent,
    ButtonComponent
  ],
  standalone: true,
})
export class AlertComponent implements OnChanges {
  /**
   * Alert type
   */
  @Input() public type: 'success' | 'danger' | 'warning' | 'emergency' | 'info' = 'info';
  @Input() public dismissible = false;
  @Output() public dismiss = new EventEmitter();
  public iconType = '';
  public iconTitle = '';

  @HostBinding('class') hostClass = 'vdm-alert vdm-alert-with-icon vdm-alert-dismissible fade show';
  @HostBinding('class.vdm-alert-success') get isSuccess() {
    return this.type === 'success';
  }
  @HostBinding('class.vdm-alert-danger') get isDanger() {
    return this.type === 'danger';
  }
  @HostBinding('class.vdm-alert-warning') get isWarning() {
    return this.type === 'warning';
  }
  @HostBinding('class.vdm-alert-info') get isInfo() {
    return this.type === 'info';
  }
  @HostBinding('class.vdm-alert-emergency') get isEmergency() {
    return this.type === 'emergency';
  }
  @HostBinding('attr.role') hostRole = 'alert';

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['type']) {
      const currentValue = changes['type'].currentValue;
      if (currentValue) {
        this.iconType = this.alertTypeIcon(currentValue);
        this.iconTitle = this.alertTitleIcon(currentValue);
      }
    }
  }

  public alertTypeIcon(value: keyof AlertKind): string {
    return typesAlertIcon[value].icon || typesAlertIcon.default.icon;
  }
  public alertTitleIcon(value: keyof AlertKind): string {
    return typesAlertIcon[value].title || typesAlertIcon.default.title;
  }

  public onDismissClicked() {
    this.dismiss.emit();
  }
}

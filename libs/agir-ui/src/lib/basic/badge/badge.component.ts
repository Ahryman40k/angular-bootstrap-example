import { Component, HostBinding, Input, ViewEncapsulation } from '@angular/core';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-badge',
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true
})
export class BadgeComponent {
  @Input() public type: '' | 'success' | 'danger' | 'warning' | 'info' = '';

  @HostBinding('class.positive') get isPositive() {
    return this.type === 'success';
  }
  @HostBinding('class.negative') get isNegative() {
    return this.type === 'danger';
  }
  @HostBinding('class.warning') get isWarning() {
    return this.type === 'warning';
  }
  @HostBinding('class.informative') get isInformative() {
    return this.type === 'info';
  }
}

import { Directive, HostBinding } from '@angular/core';

/**
 * Label of a list item, add css class to apply proper styling.
 */

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-menu-item-label, [vdm-menu-item-label]',
  standalone: true
})
export class MenuItemLabelDirective {
  @HostBinding('class') hostClass = 'vdm-menu-item-label';
}

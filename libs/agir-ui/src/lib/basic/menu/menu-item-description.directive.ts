import { Directive, HostBinding } from '@angular/core';

/**
 * Description of a list item, add css class to apply proper styling.
 */

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-menu-item-description, [vdm-menu-item-description]',
  standalone: true
})
export class MenuItemDescriptionDirective {
  @HostBinding('class') hostClass = 'vdm-menu-item-description';
}

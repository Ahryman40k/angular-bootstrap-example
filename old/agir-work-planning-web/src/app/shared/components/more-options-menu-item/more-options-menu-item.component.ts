import { Component, Input } from '@angular/core';

import { IMoreOptionsMenuItem } from '../../models/more-options-menu/more-options-menu-item';

@Component({
  selector: 'app-more-options-menu-item',
  templateUrl: './more-options-menu-item.component.html'
})
export class MoreOptionsMenuItemComponent {
  @Input() public item: IMoreOptionsMenuItem;
}

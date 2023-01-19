import { Component, ContentChild, ContentChildren, Input } from '@angular/core';

import { ListItemActionComponent } from '../list-item-action/list-item-action.component';
import { ListItemDetailsComponent } from '../list-item-details/list-item-details.component';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss']
})
export class ListItemComponent {
  public showDescription: boolean;
  @ContentChild(ListItemDetailsComponent) public detailsComponent: ListItemDetailsComponent;
  @ContentChildren(ListItemActionComponent) public actionsComponents: ListItemActionComponent[];
  @Input() public mainClass = 'border-top';
  @Input() public isButtonAlwaysVisible = false;
  @Input() public isHovered = false;
  @Input() public isDescriptionCollapsible = false;
  @Input() public mainContentClass = '';

  public get hasDetails(): boolean {
    return !!this.detailsComponent;
  }

  public get hasOptions(): boolean {
    return !!this.actionsComponents && !!this.actionsComponents.length;
  }

  public clickCard(): void {
    if (this.hasDetails || this.isDescriptionCollapsible) {
      this.showDescription = !this.showDescription;
    }
  }
}

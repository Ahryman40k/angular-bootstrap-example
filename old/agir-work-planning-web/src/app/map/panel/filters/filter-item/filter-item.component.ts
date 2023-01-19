import { Component, EventEmitter, Input, Output } from '@angular/core';

import { IFilterItem } from '../filter-item-layout/filter-item-layout.component';

export enum EIconPosition {
  Left = 'left',
  Right = 'right'
}

@Component({
  selector: 'app-filter-item',
  templateUrl: './filter-item.component.html',
  styleUrls: ['./filter-item.component.scss']
})
export class FilterItemComponent {
  public eIconPosition = EIconPosition;

  @Input() public item: IFilterItem;

  @Input() public canDelete: boolean;
  @Input() public iconPosition = EIconPosition.Left;

  @Output() public itemClick = new EventEmitter();
  @Output() public removeClick = new EventEmitter();

  public isSubItemsCollapsed: boolean = true;

  public get active(): boolean {
    return !!this.item.selected;
  }

  public onItemClick(): void {
    if (this.canDelete && this.item.selected) {
      return this.removeClick.emit();
    }
    this.item.selected = !this.active;
    this.itemClick.emit();
  }

  public toggleCollapse(): void {
    this.isSubItemsCollapsed = !this.isSubItemsCollapsed;
  }
}

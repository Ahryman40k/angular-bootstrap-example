import { Component, EventEmitter, forwardRef, Input, OnInit, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { get } from 'lodash';
import { FormComponent } from 'src/app/shared/forms/form-component';

import { EIconPosition } from '../filter-item/filter-item.component';

export interface IFilterItem {
  icon?: string;
  item?: any;
  label: string;
  selected?: boolean;
  value?: any;
  subItems?: IFilterItem[];
}

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FilterItemLayoutComponent),
  multi: true
};

@Component({
  selector: 'app-filter-item-layout',
  templateUrl: './filter-item-layout.component.html',
  styleUrls: ['./filter-item-layout.component.scss'],
  host: {
    class: 'pb-1'
  },
  providers: [valueAccessorProvider]
})
export class FilterItemLayoutComponent extends FormComponent<any[]> implements OnInit {
  public _items: any;
  public _bindIcon: any;
  public _bindLabel: any;
  public _bindValue: any;

  @Input() public canDelete = false;

  public get items(): any[] {
    return this._items;
  }
  @Input()
  public set items(i: any[]) {
    this._items = i;
    this.createFilterItems();
  }

  public get bindIcon(): string {
    return this._bindIcon;
  }
  @Input()
  public set bindIcon(i: string) {
    this._bindIcon = i;
    this.createFilterItems();
  }

  public get bindLabel(): string {
    return this._bindLabel;
  }
  @Input()
  public set bindLabel(i: string) {
    this._bindLabel = i;
    this.createFilterItems();
  }

  public get bindValue(): string {
    return this._bindValue;
  }
  @Input()
  public set bindValue(i: string) {
    this._bindValue = i;
    this.createFilterItems();
  }

  @Input() public collapsible = false;
  @Input() public selectAll = false;
  @Input() public iconPosition = EIconPosition.Left;

  @Input() public multiSelect = true;

  @Output() public itemClick = new EventEmitter();
  @Output() public itemRemove = new EventEmitter();

  public collapsed = false;
  public filterItems: IFilterItem[] = [];

  public selectAllItem: IFilterItem = {
    label: 'Tout afficher',
    selected: true
  };

  public ngOnInit(): void {
    this.updateSelectAllActive();
  }

  public writeValue(value: any[]): void {
    super.writeValue(value);
    this.createFilterItems();
    this.updateSelectAllActive();
  }

  public createFilterItems(): void {
    const filterItems = [];
    const items = this.items || [];
    for (const item of items) {
      const itemValue = get(item, this.bindValue);
      filterItems.push({
        icon: get(item, this.bindIcon),
        label: get(item, this.bindLabel),
        value: itemValue,
        item,
        selected: this.doesValueInclude(itemValue)
      });
    }
    this.filterItems = filterItems;
    if (this.selectAll && this.value?.length === this.items?.length) {
      this.selectAllItems();
    }
  }

  private doesValueInclude(itemValue: any): boolean {
    return !!this.value?.includes(itemValue);
  }

  public onItemClick(item: IFilterItem): void {
    if (!item.selected) {
      const newValue = this.value?.filter(x => x !== item.value);
      this.value = newValue?.length ? newValue : undefined;
    } else {
      if (this.multiSelect) {
        this.value = this.value ? [...this.value, item.value] : [item.value];
      } else {
        this.value = [item.value];
        this.createFilterItems();
      }
    }
    if (this.selectAll && (!this.value || this.value.length === this.items.length)) {
      this.selectAllItems();
    }
    this.updateSelectAllActive();
    this.itemClick.emit(item);
  }

  public onRemoveClick(item: IFilterItem): void {
    this.itemRemove.emit(item);
  }

  public toggleCollapse(): void {
    this.collapsed = !this.collapsed;
  }

  public selectAllItems(): void {
    if (!this.selectAll) {
      return;
    }
    this.value = undefined;
    this.selectAllItem.selected = true;
    for (const item of this.filterItems) {
      item.selected = false;
    }
  }

  private updateSelectAllActive(): void {
    if (!this.selectAll) {
      return;
    }
    this.selectAllItem.selected = !this.value?.length || this.value?.length === this.items?.length;
  }
}

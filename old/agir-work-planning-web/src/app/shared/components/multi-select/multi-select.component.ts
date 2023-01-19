import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { get } from 'lodash';

import { FormComponent } from '../../forms/form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MultiSelectComponent),
  multi: true
};

@Component({
  selector: 'vdm-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrls: ['./multi-select.component.scss'],
  providers: [valueAccessorProvider]
})
export class MultiSelectComponent extends FormComponent<any[]> {
  @Input() public appendTo: string;
  @Input() public bindLabel: string;
  @Input() public bindValue: string;
  @Input() public closeOnSelect = false;
  @Input() public hideSelected = true;
  @Input() public items: any;
  @Input() public maxSelectedItems: number;
  @Input() public selectableGroup: boolean;
  @Input() public searchable = false;
  @Input() public placeholder: string;
  @Input() public ngSelectClass: string;
  @Input() public multiple: boolean;
  @Input() public removableItems = true;

  public getLabel(item: string): any {
    const i = this.bindValue === undefined ? item : this.items?.find(x => get(x, this.bindValue) === item);
    return this.bindLabel === undefined ? i : get(i, this.bindLabel);
  }

  public removeItem(item: string): void {
    if (!this.removableItems) {
      return;
    }
    this.value = this.value.filter(i => i !== item);
  }
}

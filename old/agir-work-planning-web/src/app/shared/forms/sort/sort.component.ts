import { Component, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { FormComponent } from '../form-component';

export type SortDirection = 'asc' | 'desc';

export interface ISortValue {
  key: string;
  direction: SortDirection;
}

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SortComponent),
  multi: true
};

@Component({
  selector: 'app-sort',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.scss'],
  providers: [valueAccessorProvider]
})
export class SortComponent extends FormComponent<ISortValue> {
  @Input() public ngSelectClass: string;
  @Input() public sortDirection: SortDirection;
  @Input() public filters: { key: string; label: string }[];
  @Output() public directionChange = new EventEmitter();

  /**
   * Called when there's a change on the input.
   * @param event
   */
  public onSortKeyChange(event: string): void {
    this.value = { key: event, direction: this.sortDirection };
  }

  public onDirectionChange(): void {
    if (this.sortDirection === 'asc') {
      this.sortDirection = 'desc';
    } else {
      this.sortDirection = 'asc';
    }
    this.value = { key: this.value.key, direction: this.sortDirection };
  }
}

import { Component, ElementRef, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { FormComponent } from '../form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => SelectCheckboxComponent),
  multi: true
};

@Component({
  selector: 'app-select-checkbox',
  templateUrl: './select-checkbox.component.html',
  styleUrls: ['./select-checkbox.component.scss'],
  providers: [valueAccessorProvider]
})
export class SelectCheckboxComponent extends FormComponent<any[]> {
  @Input() public items: any[];
  @Input() public itemLabelKey: string;

  constructor(private readonly elementRef: ElementRef) {
    super();
  }

  public isSelected(item: any): boolean {
    return this.value && this.value.indexOf(item) > -1;
  }

  /**
   * Selects or unselects items.
   * @param item The item that has been interacted with.
   */
  public onSelected(item: any, selected: boolean): void {
    const foundIndex = this.value ? this.value.indexOf(item) : -1;
    if ((foundIndex > -1 && selected) || (foundIndex === -1 && !selected)) {
      return;
    }
    const value = this.value ? [...this.value] : [];
    if (selected) {
      value.push(item);
    } else {
      value.splice(foundIndex, 1);
    }
    this.value = value;
  }

  /**
   * Retrieves the label for the item based on the `itemLabelKey`.
   * @param item The item.
   * @returns The label.
   */
  public itemLabel(item: any): string {
    if (item) {
      if (this.itemLabelKey) {
        const keys = this.itemLabelKey.split('.');
        let value = item as any;
        for (const key of keys) {
          value = value[key];
        }
        return value;
      }
      if (item.toString) {
        return item.toString();
      }
    }
    return undefined;
  }

  /**
   * Called when a checkbox has been blurred.
   */
  public checkboxBlur(): void {
    setTimeout(() => {
      if (!this.elementRef.nativeElement.querySelector(':focus')) {
        this.touched();
      }
    }, 100);
  }
}

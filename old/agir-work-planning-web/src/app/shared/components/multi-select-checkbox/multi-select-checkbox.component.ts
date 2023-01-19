import { Component, forwardRef, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { MultiSelectComponent } from '../multi-select/multi-select.component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => MultiSelectCheckboxComponent),
  multi: true
};

/**
 * A multi select dropdown with the style of a badge and checkboxes
 */
@Component({
  selector: 'vdm-multi-select-checkbox',
  templateUrl: './multi-select-checkbox.component.html',
  styleUrls: ['./multi-select-checkbox.component.scss'],
  providers: [valueAccessorProvider]
})
export class MultiSelectCheckboxComponent extends MultiSelectComponent {
  @Input() public isCheckboxEnabled = true;

  public bindLabel = 'label.fr';
  public bindValue = 'code';
  public closeOnSelect = false;
  public hideSelected = false;
  public multiple = true;
  public selectableGroup = true;
  public searchable = false;
}

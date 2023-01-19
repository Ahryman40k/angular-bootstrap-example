import { Component, forwardRef, HostBinding, Input } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';

import { FormComponent } from '../form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => ToggleButtonComponent),
  multi: true
};

@Component({
  selector: 'app-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss'],
  providers: [valueAccessorProvider]
})
export class ToggleButtonComponent extends FormComponent<boolean> {
  @Input() public label: string;
  @Input() public icon: string;

  @HostBinding('class.readonly')
  @Input()
  public readonly: boolean;

  public onToggle(): void {
    if (!!this.readonly) {
      return;
    }
    this.value = !this.value;
  }
}

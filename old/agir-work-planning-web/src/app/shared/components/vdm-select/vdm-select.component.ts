import { AfterViewInit, Component, forwardRef, Input, ViewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgSelectComponent } from '@ng-select/ng-select';

import { FormComponent } from '../../forms/form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => VdmSelectComponent),
  multi: true
};

@Component({
  selector: 'vdm-select',
  templateUrl: './vdm-select.component.html',
  styleUrls: ['./vdm-select.component.scss'],
  providers: [valueAccessorProvider]
})
export class VdmSelectComponent extends FormComponent<any[]> implements AfterViewInit {
  @ViewChild('ngSelect') public ngSelect: NgSelectComponent;

  @Input() public appendTo: string;
  @Input() public bindLabel: string;
  @Input() public bindValue: string;
  @Input() public items: any;
  @Input() public maxSelectedItems: number;
  @Input() public placeholder: string;
  @Input() public ngSelectClass: string;
  @Input() public autofocus = false;
  @Input() public clearable = false;
  @Input() public closeOnSelect = true;
  @Input() public searchable = false;
  @Input() public groupBy: string;

  public ngAfterViewInit(): void {
    if (this.autofocus) {
      this.ngSelect.focus();
    }
  }
}

import {
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { padEnd } from 'lodash';

import { FormComponent } from '../form-component';

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => InputFloatComponent),
  multi: true
};

@Component({
  selector: 'app-input-float',
  templateUrl: './input-float.component.html',
  styleUrls: ['./input-float.component.scss'],
  providers: [valueAccessorProvider]
})
export class InputFloatComponent extends FormComponent<string> implements OnInit, OnChanges {
  @Input() public precision: number;
  @Input() public placeholder: string;
  @Input() public inputValue: string;
  @Output() public onKeyUp = new EventEmitter<number>();

  @ViewChild('inputFloat') public inputFloat: ElementRef;

  private _estimatePattern = null;
  public mask: string;

  constructor() {
    super();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.precision?.currentValue) {
      /**
       * Regex for the estimate input text
       * https://www.npmjs.com/package/ngx-mask
       */
      this._estimatePattern = {
        '0': { pattern: new RegExp(`^\\d{1,}([,]{1}\\d{1,${changes.precision.currentValue}}){0,1}`) }
      };
      this.mask = padEnd('0*,', changes.precision.currentValue + 3, '0');
    }
    if (changes.inputValue?.currentValue) {
      this.value = changes.inputValue.currentValue
        .toString()
        .split('.')
        .join(',');
    }
  }

  public get estimatePattern(): any {
    return this._estimatePattern;
  }

  /**
   * Called when there's a keyup on the input.
   * @param inputFloat
   */
  public keyUp(inputFloat: HTMLInputElement): void {
    if (typeof inputFloat?.value !== 'string') {
      return;
    }
    this.value = inputFloat?.value;
    this.onKeyUp.emit(parseFloat(this.value.split(',').join('.')));
  }
}

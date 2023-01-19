import { Component, ElementRef, EventEmitter, forwardRef, Input, Output } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { FormComponent } from '../form-component';

enum CheckboxMode {
  checkbox = 'checkbox',
  switch = 'switch'
}

const valueAccessorProvider = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => CheckboxComponent),
  multi: true
};

@Component({
  selector: 'app-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  host: {
    '[class.custom-control]': 'true',
    '[class.custom-checkbox]': 'mode === "checkbox"',
    '[class.custom-switch]': 'mode === "switch"'
  },
  providers: [valueAccessorProvider]
})
export class CheckboxComponent extends FormComponent<boolean> {
  public get currentLabel(): string {
    return this.label ? this.label : this.value ? this.labelOn : this.labelOff;
  }
  @Input()
  public get mode(): CheckboxMode {
    return this._mode;
  }
  public set mode(v: CheckboxMode) {
    if (!(v in CheckboxMode)) {
      throw new Error('Invalid checkbox mode');
    }
    this._mode = v;
  }
  @Input() public label: string;
  @Input() public labelOn: string;
  @Input() public labelOff: string;
  @Input() public labelClass: string;
  @Output() public onBlur = new EventEmitter();
  @Output() public change = new EventEmitter<boolean>();

  private _mode: CheckboxMode = CheckboxMode.checkbox;

  constructor(private readonly elementRef: ElementRef) {
    super();

    this.value = false;

    // Listens on click capture to redirect the click on the checkbox.
    fromEvent(elementRef.nativeElement, 'click', { capture: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.redirectClick());
  }

  public setValue(checked: boolean): void {
    const input = this.elementRef.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    this.value = checked;
    input.checked = this.value;
    input.dispatchEvent(new Event('change'));
  }

  /**
   * Called when there's a change on the input.
   * @param event
   */
  public onInputChange(event: Event): void {
    const checkboxInput = event.target as HTMLInputElement;
    this.value = checkboxInput.checked;
    this.change.emit(this.value);
  }

  /**
   * Redirects the click on the checkbox input.
   */
  public redirectClick(): void {
    if (this.disabled) {
      return;
    }
    const input = this.elementRef.nativeElement.querySelector('input') as HTMLInputElement;
    input.focus();
    input.checked = !this.value;
    input.dispatchEvent(new Event('change'));
  }

  /**
   * Marks the checkbox as touched.
   */
  public touched(): void {
    super.touched();
    this.onBlur.emit();
  }

  /**
   * Called when the input checkbox is blurred.
   */
  public checkboxBlur(): void {
    setTimeout(() => {
      if (!this.elementRef.nativeElement.querySelector(':focus')) {
        this.touched();
      }
    }, 100);
  }
}

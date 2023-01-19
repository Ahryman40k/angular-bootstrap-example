import { Directive, ElementRef, forwardRef, Inject, LOCALE_ID, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  // tslint:disable-next-line:directive-selector
  selector: 'input[type="text"][vdmIntegerInput]',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IntegerInputDirective),
      multi: true
    }
  ]
})
export class IntegerInputDirective implements OnInit, ControlValueAccessor {
  private readonly htmlInputElement: HTMLInputElement;
  private oldValue: string;
  private oldSelectionStart: number;
  private oldSelectionEnd: number;

  private onChange: (_: any) => void;
  private onTouched: () => void;

  constructor(elementRef: ElementRef, @Inject(LOCALE_ID) private readonly localeId: string) {
    this.htmlInputElement = elementRef.nativeElement;
  }

  public ngOnInit(): void {
    ['input', 'keydown', 'keyup', 'mousedown', 'mouseup', 'select', 'contextmenu', 'drop'].forEach(event => {
      this.htmlInputElement.addEventListener(event, this.eventListener);
    });
    this.htmlInputElement.addEventListener('blur', () => {
      if (this.onTouched) {
        this.onTouched();
      }
    });
  }

  public writeValue(obj: number): void {
    this.htmlInputElement.value = this.formatInteger(obj);
  }

  public registerOnChange(fn: (value: number) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.htmlInputElement.disabled = isDisabled;
  }

  private readonly eventListener = () => {
    let value = this.htmlInputElement.value;
    if (value === this.oldValue) {
      return;
    }
    if (value === '') {
      this.setValue(null);
      return;
    }
    const replaced = value.replace(/\s/g, '');
    // tslint:disable-next-line: radix
    const int = parseInt(replaced);
    if (isNaN(int) || int > Number.MAX_SAFE_INTEGER) {
      if (this.oldValue !== undefined) {
        this.htmlInputElement.value = this.oldValue;
        this.htmlInputElement.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.htmlInputElement.value = '';
      }
      this.dispatchInput();
      return;
    }
    value = this.formatInteger(int);
    this.htmlInputElement.value = value;
    this.setValue(int);
  };

  private dispatchInput(): void {
    this.htmlInputElement.removeEventListener('input', this.eventListener);
    this.htmlInputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
    this.htmlInputElement.addEventListener('input', this.eventListener);
  }

  private setValue(int: number): void {
    this.onChange(int);
    this.dispatchInput();
    this.oldValue = this.htmlInputElement.value;
    this.oldSelectionStart = this.htmlInputElement.selectionStart;
    this.oldSelectionEnd = this.htmlInputElement.selectionEnd;
  }

  private formatInteger(int: number): string {
    return int?.toLocaleString(this.localeId).trim() || '';
  }
}

import { EventEmitter, Input, OnDestroy, Output } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { BaseComponent } from 'src/app/shared/components/base/base.component';

/**
 * Base implementation of a form component that implements a ControlValueAccessor.
 * @template T The type of the form value.
 */
export class FormComponent<T> extends BaseComponent implements ControlValueAccessor, OnDestroy {
  private _value: T;
  protected onChange: (newValue: T) => void;
  private onTouched: () => void;

  public get value(): T {
    return this._value;
  }
  @Input()
  public set value(v: T) {
    if (this._value === v) {
      return;
    }
    this._value = v;
    this.valueChange.emit(v);
    if (this.onChange) {
      this.onChange(this._value);
    }
  }
  @Output() public valueChange = new EventEmitter<T>();

  @Input() public disabled = false;
  @Input() public id: string;

  public writeValue(value: T): void {
    this._value = value;
  }

  public registerOnChange(fn: (newValue: T) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public touched(): void {
    if (this.onTouched) {
      this.onTouched();
    }
  }
}

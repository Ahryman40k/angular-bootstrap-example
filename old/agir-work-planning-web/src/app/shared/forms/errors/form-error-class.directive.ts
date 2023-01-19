import { Directive, HostBinding } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * The form error class directive.
 * Its goal is to add a 'is-invalid' class to inputs and selects
 * when the associated form control is invalid and touched.
 */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[formControlName],[ngModel],[formControl]'
})
export class FormErrorClassDirective {
  @HostBinding('class.is-invalid')
  public get classIsInvalid(): boolean {
    return this.ngControl.touched && this.ngControl.invalid;
  }

  constructor(private readonly ngControl: NgControl) {}
}

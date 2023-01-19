import { Component, ContentChildren, QueryList } from '@angular/core';
import { ControlValueAccessor, NgControl } from '@angular/forms';

import { FormErrorStructuralDirective } from './form-error-structural.directive';

/**
 * Component that displays form control errors.
 *
 * Usage:
 * <app-form-errors formControlName="firstName">
 *  <app-form-error *appForm="'required'">Please enter a first name<app-form-error>
 * </app-form-errors>
 *
 * See: interventions/intervention.component.html
 */
@Component({
  selector: 'app-form-errors',
  templateUrl: './form-errors.component.html'
})
export class FormErrorsComponent implements ControlValueAccessor {
  @ContentChildren(FormErrorStructuralDirective) public errorDirectives: QueryList<FormErrorStructuralDirective>;

  constructor(public formControl: NgControl) {
    formControl.valueAccessor = this;
  }

  /**
   * Fake implementation of ControlValueAccessor to retrieve the form control errors.
   */
  // tslint:disable-next-line: no-empty
  public writeValue(_obj: any): void {}
  // tslint:disable-next-line: no-empty
  public registerOnChange(_fn: any): void {}
  // tslint:disable-next-line: no-empty
  public registerOnTouched(_fn: any): void {}
  // tslint:disable-next-line: no-empty
  public setDisabledState?(_isDisabled: boolean): void {}
}

import { Directive, HostBinding } from '@angular/core';

/**
 * The app form error tag directive.
 * Used to hold the content of the error.
 *
 * Usage:
 * <app-error *appError="'required'">The field is required</app-error>
 */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: 'app-form-error'
})
export class FormErrorTagDirective {
  @HostBinding('class.invalid-feedback') public classInvalidFeedback = true;
}

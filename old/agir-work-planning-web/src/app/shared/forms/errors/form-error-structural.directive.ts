import { Directive, Input, TemplateRef } from '@angular/core';

/**
 * The form error structural directive.
 * Used with the form error tag directive.
 *
 * Usage:
 * <app-error *appError="'required'">The field is required</app-error>
 */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[appFormError]'
})
export class FormErrorStructuralDirective {
  // tslint:disable-next-line: no-input-rename
  @Input('appFormErrorKey') public key: string;

  public constructor(public template: TemplateRef<any>) {}
}

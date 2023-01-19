import { FormGroup } from '@angular/forms';

/**
 * Marks all controls in a form group as touched
 * @param formGroup - The form group to touch
 */
export function markAllAsTouched(formGroup: FormGroup): void {
  formGroup.markAsTouched();
  Object.keys(formGroup.controls)
    .map(x => formGroup.controls[x])
    .forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        markAllAsTouched(control);
      }
    });
}

export function disableFormControls(formControlNames: string[], form: FormGroup): void {
  formControlNames.forEach(f => {
    form.controls[f].disable();
  });
}

export function enableFormControls(formControlNames: string[], form: FormGroup): void {
  formControlNames.forEach(f => {
    form.controls[f].enable();
  });
}

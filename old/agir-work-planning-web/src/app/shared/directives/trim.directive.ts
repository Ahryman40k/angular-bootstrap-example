import { Directive, HostListener } from '@angular/core';
import { NgControl } from '@angular/forms';

/**
 * Directive that trims the control value on blur event
 */
@Directive({ selector: '[appTrim]' })
export class TrimDirective {
  constructor(private readonly ngControl: NgControl) {}

  @HostListener('blur', ['$event.target.value'])
  public applyTrim(value: string): void {
    this.ngControl.control.setValue(value.trim());
  }
}

import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appEmptyPlaceholder]'
})
export class EmptyPlaceholderDirective {
  @Input() public placeholder: string;

  constructor(private readonly input: ElementRef) {}

  @HostListener('focus')
  public onFocus(): void {
    this.input.nativeElement.placeholder = '';
  }

  @HostListener('blur')
  public onBlur(): void {
    this.input.nativeElement.placeholder = this.placeholder;
  }
}

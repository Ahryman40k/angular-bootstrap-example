import { AfterContentInit, Component, ElementRef, HostBinding, Renderer2 } from '@angular/core';

/**
 * Divider to separate sections.
 */

@Component({
  template: `<hr />`,
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-menu-divider, [vdm-menu-divider]',
  standalone: true
})
export class MenuDividerComponent implements AfterContentInit {
  constructor(private renderer: Renderer2, private elementRef: ElementRef<HTMLElement>) { }

  @HostBinding('class') hostClass = 'vdm-menu-divider';

  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  public ngAfterContentInit(): void {
    this.renderer.setAttribute(this.nativeElement, 'role', 'separator');
  }
}

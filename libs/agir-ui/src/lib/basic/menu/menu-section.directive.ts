
import {
  AfterViewInit, Directive,
  ElementRef, HostBinding, Renderer2
} from '@angular/core';

/**
 * Sections of list items in menu. Apply proper styling to section's title if there is one.
 */

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-menu-section, [vdm-menu-section]',
  standalone: true
})
export class MenuSectionDirective implements AfterViewInit {
  constructor(private elementRef: ElementRef<HTMLElement>, private renderer: Renderer2) { }

  @HostBinding('class') hostClass = 'vdm-menu-section';

  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  public ngAfterViewInit(): void {
    const children = Array.from(this.nativeElement.childNodes);
    const textIndex = children.findIndex((c: ChildNode) => c.nodeName === '#text');
    if (textIndex > -1) {
      this.insertTitle(children, textIndex);
    }
  }

  private insertTitle(children: ChildNode[], txtIdx: number): void {
    const titleElement = this.renderer.createElement('h5');
    this.renderer.setProperty(titleElement, 'textContent', children[txtIdx].nodeValue);
    this.renderer.removeChild(this.nativeElement, children[txtIdx]);
    const listIndex = children.findIndex((c: ChildNode) => c.nodeName === 'UL');
    this.renderer.insertBefore(this.nativeElement, titleElement, children[listIndex]);
  }
}

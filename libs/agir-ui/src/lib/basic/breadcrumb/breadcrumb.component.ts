import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';

const LAST_NODE_ATTRIBUTE = { 'aria-current': 'page' };

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
})
export class BreadcrumbComponent implements AfterViewInit {
  @HostBinding('class') hostClass = 'vdm-breadcrumb';

  @ViewChild('container', { static: false }) private staticContainer: ElementRef | null = null;

  constructor(private renderer: Renderer2) {}

  public ngAfterViewInit() {
    this.setLastLinkAttribute();
  }

  public onContentChange() {
    this.setLastLinkAttribute();
  }

  private setLastLinkAttribute() {
    if (this.staticContainer) {
      const children = Array.from(this.staticContainer.nativeElement.children);
      this.renderer.setAttribute(
        children[children.length - 1],
        Object.keys(LAST_NODE_ATTRIBUTE)[0],
        Object.values(LAST_NODE_ATTRIBUTE)[0]
      );
    }
  }
}

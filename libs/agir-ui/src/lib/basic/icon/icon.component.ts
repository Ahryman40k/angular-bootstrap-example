import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnDestroy,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColorKind, ColorToHex } from '../core';
import { IconRegistry } from './icon-registry';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const TITLE = 'title';

export type IconSize = 'medium' | 'small' | 'x-small' | 'xx-small';

@Component({
  selector: 'vdm-icon',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnDestroy {
  /** The color of the icon, if not specified the icon's parent current text color will be used */
  @Input() public color: ColorKind = 'default';

  /**
   * The size of the icon
   */
  @Input() public size: IconSize = 'x-small';

  private _svgIcon: string;
  private _title: string;
  private _titleId: string;

  // Keeps track of the elements and attributes that we've prefixed with the current path.
  private _elementsWithExternalReferences?: Map<Element, { name: string; value: string }[]>;

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private iconRegistry: IconRegistry,
    private renderer: Renderer2
  ) {
    this._titleId = '';
    this._title = '';
    this._svgIcon = '';
  }

  // @HostBinding('role') role = 'img';

  @HostBinding('class.vdm-icon') get isIcon() {
    return true;
  }
  @HostBinding('class.notranslate') get isNoTranslate() {
    return true;
  }
  @HostBinding('class.vdm-icon-medium') get isIconMedium() {
    return this.size === 'medium';
  }
  @HostBinding('class.vdm-icon-small') get isIconSmall() {
    return this.size === 'small';
  }
  @HostBinding('class.vdm-icon-x-small') get isXSmall() {
    return this.size === 'x-small';
  }
  @HostBinding('class.vdm-icon-xx-small') get isXXSmall() {
    return this.size === 'xx-small';
  }
  @HostBinding('attr.data-vdm-icon-type') get iconType() {
    return 'svg';
  }
  @HostBinding('style.color') get designatedColor() {
    return this.hexColor;
  }

  /** Name of the icon in the SVG icon set. */
  @Input()
  get svgIcon(): string {
    return this._svgIcon;
  }

  set svgIcon(value: string) {
    if (value !== this._svgIcon) {
      if (value) {
        this.updateSvgIcon(value, this.title);
      } else if (this._svgIcon) {
        this.clearSvgElement();
      }
      this._svgIcon = value;
      this.renderer.addClass(this.elementRef.nativeElement, `vdm-${this._svgIcon}`);
    }
  }

  /** Title that will be used as an aria-label for the icon */
  @Input()
  get title(): string {
    return this._title;
  }
  set title(value: string) {
    if (value !== this._title) {
      this._title = value;
      this._titleId = this.generateUniqueTitleId();
      this.updateSvgIcon(this.svgIcon, value);
    }
  }

  get hexColor(): string | void {
    if (this.color === 'default') return;

    return ColorToHex(this.color);
  }

  get titleId(): string {
    return this._titleId;
  }

  public ngOnDestroy() {
    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }
  }

  private setSvgElement(svg: SVGElement) {
    this.clearSvgElement();
    // Workaround for IE11 and Edge ignoring `style` tags inside dynamically-created SVGs.
    // See: https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10898469/
    // Do this before inserting the element into the DOM, in order to avoid a style recalculation.
    const styleTags = svg.querySelectorAll('style');
    // eslint-disable-next-line @typescript-eslint/prefer-for-of
    for (let i = 0; i < styleTags.length; i++) {
      styleTags[i].textContent += ' ';
    }
    this.elementRef.nativeElement.appendChild(svg);
  }

  private clearSvgElement() {
    const layoutElement: HTMLElement = this.elementRef.nativeElement;
    let childCount = layoutElement.childNodes.length;

    if (this._elementsWithExternalReferences) {
      this._elementsWithExternalReferences.clear();
    }

    // Remove existing non-element child nodes and SVGs, and add the new SVG element. Note that
    // we can't use innerHTML, because IE will throw if the element has a data binding.
    while (childCount--) {
      const child = layoutElement.childNodes[childCount];

      // 1 corresponds to Node.ELEMENT_NODE. We remove all non-element nodes in order to get rid
      // of any loose text nodes, as well as any SVG elements in order to remove any old icons.
      if (child.nodeType !== 1 || child.nodeName.toLowerCase() === 'svg') {
        layoutElement.removeChild(child);
      }
    }
  }

  // Sets a new SVG icon with a particular name.
  private updateSvgIcon(iconName: string | undefined, title: string | undefined) {
    if (iconName) {
      let svg = this.iconRegistry.getNamedSvgIcon(iconName);
      if (title) {
        svg = this.addTitleToSVG(svg, title);
      }

      if (!title) {
        svg.setAttribute('aria-hidden', 'true');
      }

      this.setSvgElement(svg);
    }
  }

  private addTitleToSVG(svg: SVGElement, title: string) {
    const titleNode = this.renderer.createElement(TITLE, SVG_NAMESPACE);
    titleNode.id = this._titleId;
    const titleText = this.renderer.createText(title);
    this.renderer.appendChild(titleNode, titleText);
    this.renderer.appendChild(svg, titleNode);
    svg.setAttribute('aria-labelledby', this._titleId);
    return svg;
  }

  private generateUniqueTitleId(): string {
    return this.title
      ? `${this.title.replace(/[^A-Z0-9]+/gi, '').toLocaleLowerCase()}-${Math.floor(Math.random() * 10000000000000000)}`
      : '';
  }
}

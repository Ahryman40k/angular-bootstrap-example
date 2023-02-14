import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  Renderer2,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';

const SPAN = 'span';
const SPAN_TEXT_PROPERTY = 'textContent';
const SCREEN_READER_CLASS_NAME = 'sr-only';
const BAO_ICON = 'vdm-icon';
const HAS_ICON = 'has-icon';

export type TagType = 'neutral' | 'info' | 'positive' | 'alert' | 'negative';
export type TagVariant = 'light' | 'strong';

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagComponent implements AfterViewInit {
  /**
   * The color of the tag.
   */
  @Input() public type: TagType = 'neutral';

  /**
   * The shade of the tags color.
   */
  @Input() public variant: TagVariant = 'light';

  /**
   * The hidden text for screen readers.
   */
  @Input() public hiddenText = 'Étiquette';

  constructor(private renderer: Renderer2, private elementRef: ElementRef<HTMLElement>) {}

  @HostBinding('class') hostClass = 'vdm-tag';

  @HostBinding('class.vdm-tag-neutral-light') get isNeutralLight() {
    return this.type === 'neutral' && this.variant === 'light';
  }
  @HostBinding('class.vdm-tag-neutral-strong') get isNeutralStrong() {
    return this.type === 'neutral' && this.variant === 'strong';
  }
  @HostBinding('class.vdm-tag-info-light') get isInfoLight() {
    return this.type === 'info' && this.variant === 'light';
  }
  @HostBinding('class.vdm-tag-info-strong') get isInfoStrong() {
    return this.type === 'info' && this.variant === 'strong';
  }
  @HostBinding('class.vdm-tag-positive-light') get isPositiveLight() {
    return this.type === 'positive' && this.variant === 'light';
  }
  @HostBinding('class.vdm-tag-positive-strong') get isPositiveStrong() {
    return this.type === 'positive' && this.variant === 'strong';
  }
  @HostBinding('class.vdm-tag-alert-light') get isAlertLight() {
    return this.type === 'alert' && this.variant === 'light';
  }
  @HostBinding('class.vdm-tag-alert-strong') get isAlertStrong() {
    return this.type === 'alert' && this.variant === 'strong';
  }
  @HostBinding('class.vdm-tag-negative-light') get isNegativeLight() {
    return this.type === 'negative' && this.variant === 'light';
  }
  @HostBinding('class.vdm-tag-negative-strong') get isNegativeStrong() {
    return this.type === 'negative' && this.variant === 'strong';
  }

  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  ngAfterViewInit() {
    this.addHiddenText();
    this.addIconClass();
  }

  private addHiddenText() {
    const screenReaderSpan = this.renderer.createElement(SPAN);
    this.renderer.setProperty(screenReaderSpan, SPAN_TEXT_PROPERTY, this.hiddenText);
    this.renderer.addClass(screenReaderSpan, SCREEN_READER_CLASS_NAME);
    const labelChild = Array.from(this.nativeElement.children).find((c) => c.localName === SPAN);
    this.renderer.insertBefore(this.nativeElement, screenReaderSpan, labelChild);
  }

  private addIconClass() {
    const children = Array.from(this.nativeElement.children);
    if (children.some((c) => c.localName === BAO_ICON)) {
      this.renderer.addClass(this.nativeElement, HAS_ICON);
    }
  }
}

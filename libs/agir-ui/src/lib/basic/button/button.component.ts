import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostBinding,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

const VDM_ICON_NODE_NAME = 'vdm-icon';
const LOADING_SPINNER_CLASS = 'loading-spinner';


export type ButtonSize = 'large' | 'medium' | 'small'
export type ButtonLevel = 'primary' | 'secondary' | 'tertiary'
export type ButtonDisplayType = 'utility' | 'editorial'

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'button[vdm-button]',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements AfterViewInit {
  /**
   * The display type of the button
   */
  @Input() public displayType: ButtonDisplayType = 'utility';
  /**
   * The hierarchy level of the button
   */
  @Input() public level: ButtonLevel = 'primary';
  /**
   * The size of the button
   */
  @Input() public size: ButtonSize = 'medium';
  /**
   * Flag to set the button in loading state
   */
  @Input() public loading = false;
  /**
   * Flag to set the button reversed color mode
   */
  @Input() public reversed = false;
  /**
   * The aria-label of the loading spinner if it displayed alone
   */
  @Input() public loadingSpinnerAriaLabel = 'chargement';
  /**
   * Allows the button to grow to the width of it's container
   */
  @Input() public fullWidth = false;

  /**
   * If there is no text, some margin/padding will be different, i.e. for the spinner
   */
  public noText = false;

  /**
   * If the icon is on the right of the label, the loading spinner will need to be on the right of the label
   */
  public rightIcon = false;

  constructor(private elementRef: ElementRef<HTMLElement>, private cdr: ChangeDetectorRef) {}

  @HostBinding('class.vdm-button') isButton = true;
 
  @HostBinding('class.vdm-button-utility') get isUtility() {
    return this.displayType === 'utility';
  }

  @HostBinding('class.vdm-button-editorial') get isEditorial() {
    return this.displayType === 'editorial';
  }
  @HostBinding('class.vdm-button-primary') get isPrimary() {
    return this.level === 'primary';
  }
  @HostBinding('class.vdm-button-secondary') get isSecondary() {
    return this.level === 'secondary';
  }
  @HostBinding('class.vdm-button-tertiary') get isTertiary() {
    return this.level === 'tertiary';
  }
  @HostBinding('class.vdm-button-large') get isLarge() {
    return this.size === 'large';
  }
  @HostBinding('class.vdm-button-medium') get isMedium() {
    return this.size === 'medium';
  }
  @HostBinding('class.vdm-button-small') get isSmall() {
    return this.size === 'small';
  }
  @HostBinding('class.vdm-button-reversed') get isReversed() {
    return this.reversed === true;
  }
  @HostBinding('class.vdm-button-loading') get isLoading() {
    return this.loading === true;
  }
  @HostBinding('class.vdm-button-no-text') get isNoText() {
    return this.noText === true;
  }
  @HostBinding('class.vdm-button-full-width') get isFullWidth() {
    return this.fullWidth === true;
  }


  public ngAfterViewInit() {
    const childNodes = Array.from(this.elementRef.nativeElement.childNodes);
    const textIndex = childNodes.findIndex((c) => c.nodeType === Node.TEXT_NODE);
    this.noText = textIndex === -1;
    const iconIdex = childNodes.findIndex(
      c =>
        c.nodeName === VDM_ICON_NODE_NAME &&
        !(c as HTMLElement).classList.contains(LOADING_SPINNER_CLASS)
    );
    this.rightIcon = iconIdex > textIndex;
    this.cdr.detectChanges();
  }
}

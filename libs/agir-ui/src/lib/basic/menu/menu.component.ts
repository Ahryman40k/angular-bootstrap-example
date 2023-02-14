import {
  AfterContentInit,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ContentChildren,
  ElementRef,
  EventEmitter,
  HostListener,
  Output,
  QueryList,
  Renderer2,
  ViewChild,
  ViewEncapsulation,
  Attribute,
  HostBinding,
  ChangeDetectionStrategy,
} from '@angular/core';
import { DomPortal } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { MenuItemDirective } from './menu-item.directive';

export let dropdownMenuUniqueId = 0;

@Component({
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'vdm-menu',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements AfterContentInit, AfterViewInit {
 

  /**
   * Fired when the dropdown-menu changes its 'isOpen' value
   */
  @Output() public isOpenChange = new EventEmitter<boolean>();

  /**
   * Fired when menu is closed by key event triggered from menu item
   */
  @Output() public isClosedByKeyEvent = new EventEmitter();

  /**
   * Content of menu to be loaded inside Overlay
   */
  @ViewChild('menuContent') _menuContent?: ElementRef<HTMLElement>;

  /**
   * All list items inside menu
   */
  @ContentChildren(MenuItemDirective, { descendants: true }) _listItems?: QueryList<MenuItemDirective>;

  /**
   * Unique identifier of the dropdown menu
   */
  readonly menuId = `vdm-menu-${++dropdownMenuUniqueId}`;

  /**
   * Is the dropwdown menu currently open
   */
  private _isOpen = false;

  /**
   * Reference to portal which is attached to Overlay
   */
  private _menuPortal?: DomPortal<HTMLElement | undefined> = undefined;

  /**
   * Index of currently active list item
   */
  private _activeItemIndex = -1;

  constructor(
    @Attribute('aria-current') private aria_current: string,
    private cdr: ChangeDetectorRef,
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  get isOpen(): boolean {
    return this._isOpen;
  }
  set isOpen(isOpen: boolean) {
    this._isOpen = isOpen;
    this.cdr.detectChanges();
    this.isOpenChange.emit(isOpen);
  }
  get activeItemIndex(): number {
    return this._activeItemIndex;
  }
  set activeItemIndex(index: number) {
    this._activeItemIndex = index;
  }
  get menuPortal(): DomPortal<HTMLElement | undefined> | undefined {
    return this._menuPortal;
  }
  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  
  @HostBinding('class') hostClass = 'vdm-menu-container';
  @HostBinding('class.vdm-overlay-transparent-backdrop') get hasTransparentBackdrop() {
    return this.isOpen === false;
  }
  @HostBinding('class.vdm-menu-closed') get isClosed() {
    return this.isOpen === false;
  }
  @HostBinding('attr.aria-expanded') ariaExpended = this.isOpen;

  @HostListener('window:keyup.arrowup')
  upKeyEvent() {
    if (this.isOpen) {
      const index = isNaN(this._activeItemIndex) ? 0 : this._activeItemIndex;
      const nextIndex = this.getNextActivableItemIndex(index, false);
      this.focusNextItem(nextIndex);
    }
  }

  @HostListener('window:keyup.arrowdown')
  downKeyEvent() {
    if (this.isOpen) {
      const index = isNaN(this._activeItemIndex) ? 0 : this._activeItemIndex;
      const nextIndex = this.getNextActivableItemIndex(index, true);
      this.focusNextItem(nextIndex);
    }
  }

  /** Prevents focus to be lost when TAB has reached end of menu  */
  @HostListener('window:keydown.tab')
  tabKeyEvent() {
    if (this.isOpen && this._listItems) {
      if (document.activeElement === this._listItems.last.nativeElement) {
        this.isClosedByKeyEvent.emit();
      }
    }
  }

  /** Prevents focus to be lost when SHIFT + TAB has reached beginning of menu  */
  @HostListener('window:keydown.shift.tab')
  shiftTabKeyEvent() {
    if (this.isOpen && this._listItems) {
      if (document.activeElement === this._listItems.first.nativeElement) {
        this.isClosedByKeyEvent.emit();
      }
    }
  }

  

  public ngAfterViewInit(): void {
    this.renderer.setAttribute(this.nativeElement, 'id', this.menuId);
    this._menuPortal = new DomPortal(this._menuContent);
  }

  // eslint-disable-next-line @angular-eslint/no-empty-lifecycle-method
  public ngAfterContentInit(): void {
    if (this._listItems) {
      this._listItems.forEach((item) =>
        // Todo: subscribe until what ???
        item.itemClicked.subscribe(() => this.isClosedByKeyEvent.emit())
      );
    }
  }


  public focusFirstItem(): void {
    this._activeItemIndex = 0;
    if (this._listItems) this._listItems.first.nativeElement.focus();
  }

  public open(): void {
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  /** Move the aria-current attribute to new active page */
  public setNavigationAttribute(activePageElement: HTMLElement): void {
    let previousActivePage = null;
    if (this._listItems) {
      previousActivePage = this._listItems.find(() => this.aria_current === 'page');
    }
    if (previousActivePage) {
      this.renderer.removeAttribute(previousActivePage.nativeElement, 'aria-current');
      this.renderer.removeClass(previousActivePage.nativeElement, 'active-link');
    }
    this.renderer.setAttribute(activePageElement, 'aria-current', 'page');
    this.renderer.addClass(activePageElement, 'active-link');
  }

  private focusNextItem(nextIndex: number): void {
    this._activeItemIndex = nextIndex;
    if (this._listItems) {
      const nextItem = this._listItems.get(nextIndex);
      if (nextItem) {
        nextItem.nativeElement.focus();
      }
    }
  }

  /**
   * Finds the next activable tab index when navigating with up and down arrow or TAB keys
   * @param currentIndex List item index which currently has focus
   * @param isDown Whether the navigation is going in the down direction or not
   * @param isBackward If recursive function is going backward looking for last activable item in list
   * @returns Index of the next item that will receive focus
   */
  private getNextActivableItemIndex(currentIndex: number, isDown: boolean, isBackward = false): number {
    const bCanMove = this.canMove(currentIndex, isDown);
    const isCurrentItemDisabled = this._listItems ? this._listItems.get(currentIndex)?.disabled || true : true;
    const isCurrentItemActive = !isCurrentItemDisabled;

    if (isCurrentItemActive && !bCanMove) {
      return currentIndex;
    } else if (!bCanMove) {
      const previousIndex = isDown ? currentIndex - 1 : currentIndex + 1;
      return this.getNextActivableItemIndex(previousIndex, isDown, true);
    }

    const nextIndex = isDown ? currentIndex + 1 : currentIndex - 1;
    const isNextItemDisabled = this._listItems ? this._listItems.get(nextIndex)?.disabled || true : true;

    return isNextItemDisabled
      ? isBackward
        ? currentIndex
        : this.getNextActivableItemIndex(nextIndex, isDown)
      : nextIndex;

    return 0;
  }

  /**
   * Finds if focus has reached end or beginning of list
   * @param currentIndex List item index which currently has focus
   * @param isDown Whether the navigation is going in the down direction or not
   * @returns Can focus move to next item or not
   */
  private canMove(currentIndex: number, isDown: boolean): boolean {
    const length = this._listItems ? this._listItems.length - 1 : 0;
    return !((currentIndex == 0 && !isDown) || (currentIndex == length - 1 && isDown));
  }
}

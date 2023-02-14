import {
  AfterViewInit, Directive,
  ElementRef,
  EventEmitter,
  HostBinding,
  HostListener,
  Input,
  OnChanges, Output, Renderer2,
  SimpleChanges, Attribute
} from '@angular/core';




@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-menu-item, [vdm-menu-item]',
  standalone: true
})
export class MenuItemDirective implements AfterViewInit, OnChanges {
  /**
   * Is the list item disabled
   */
  @Input() public disabled = false;

  /**
   * Emits when menu item is clicked
   */
  @Output() public itemClicked = new EventEmitter();

  constructor(
    private renderer: Renderer2,
    private elementRef: ElementRef<HTMLElement>,
    // private _parent: MenuComponent,
    @Attribute('href') private href: string
  ) { }

  @HostBinding('class') hostClass = 'vdm-menu-item';
  @HostBinding('class.vdm-menu-item-disabled') get isMenuDisabled() {
    return this.disabled === true;
  }

  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  @HostListener('window:keyup.space')
  spaceKeyEvent() {
    if (document.activeElement == this.nativeElement) {
      this.nativeElement.click();
    }
  }

  @HostListener('click', ['$event.target'])
  onClick(el: HTMLElement) {
    if (this.href) {
      // this._parent.setNavigationAttribute(this.nativeElement);
    }
    // Prevent double-click on checkbox input that undoes the toggle
    if (!el.classList.contains('vdm-checkbox-content-container')) {
      this.propagateClick();
    }
  }

  @HostListener('window:keyup.enter')
  enterKeyEvent() {
    if (document.activeElement == this.nativeElement) {
      if (this.href) {
        // this._parent.setNavigationAttribute(this.nativeElement);
      }
      this.propagateClick();
    }
  }

  public ngAfterViewInit(): void {
    this.addContentDiv();
    if (!this.disabled) {
      this.renderer.setAttribute(this.nativeElement, 'tabIndex', '0');
    }
    this.addPaddingClass();
    // Remove input element inside item from keyboard navigation sequence
    if (this.nativeElement.classList.contains('has-element-left')) {
      const item = this.nativeElement.children.item(0);
      if (item)
        this.renderer.setAttribute(item.firstElementChild, 'tabIndex', '-1');
    }
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['disabled'] && changes['disabled'].currentValue == true) {
      this.disableItem();
    }
  }

  /** Regroups label and description in a new div to help with layout */
  private addContentDiv(): void {
    const children = Array.from(this.nativeElement.children);
    const labelIndex = children.findIndex((c) => c.localName === 'vdm-menu-item-label');
    const labelElement = children[labelIndex];
    this.renderer.removeChild(this.nativeElement, children[labelIndex]);
    const contentDiv = this.renderer.createElement('div');
    this.renderer.addClass(contentDiv, 'vdm-menu-item-content');
    this.renderer.appendChild(this.nativeElement, contentDiv);
    this.renderer.appendChild(contentDiv, labelElement);
    const descriptionIndex = children.findIndex((c) => c.localName === 'vdm-menu-item-description');
    if (descriptionIndex > 0) {
      const descriptionElement = children[descriptionIndex];
      this.renderer.removeChild(this.nativeElement, children[descriptionIndex]);
      this.renderer.appendChild(contentDiv, descriptionElement);
    }
  }

  private addPaddingClass(): void {
    const children = Array.from(this.nativeElement.children);
    // Menu item has extra element next to label
    if (children.length > 1) {
      // Only toggle element can be on the right
      if (children.findIndex((c) => c.localName === 'vdm-toggle') > 0) {
        this.renderer.addClass(this.nativeElement, 'has-element-right');
      }

      // Icon, checkbox, radio button or avatar must be on the left
      else {
        this.renderer.addClass(this.nativeElement, 'has-element-left');
      }
    }
  }

  private disableItem(): void {
    if (this.disabled) {
      this.renderer.setAttribute(this.nativeElement, 'aria-disabled', 'true');
      this.renderer.setAttribute(this.nativeElement, 'tabIndex', '-1');
    }
  }

  /**
   * This method propagates a click event to menu item children with inputs (checkbox, radio button).
   * It emits event to close menu if item does not contain an input.
   */
  private propagateClick(): void {
    let closeMenu = true;
    for (let i = 0; i < this.nativeElement.children.length; i++) {
      const children = this.nativeElement.children.item(i);
      const isInput = this.nativeElement.children.item(i)?.firstElementChild?.localName == 'input' || false;

      if (isInput && children) {
        (children.firstElementChild as HTMLElement).click();
        closeMenu = false;
      }
    }

    if (closeMenu) {
      this.itemClicked.emit();
    }
  }
}
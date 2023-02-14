import {
  AfterViewInit, Directive,
  ElementRef, HostBinding,
  HostListener,
  Input,
  OnDestroy, Renderer2
} from '@angular/core';
import { ConnectedPosition, Overlay, OverlayConfig, OverlayRef } from '@angular/cdk/overlay';
import { Subject, takeUntil } from 'rxjs';
import { MenuComponent, dropdownMenuUniqueId } from './menu.component';

/**
 * Directive to be applied on element that will trigger the opening and closing of menu.
 */

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'vdm-menu-trigger, [vdm-menu-trigger], [MenuTriggerFor]',
  standalone: true
})
export class MenuTriggerDirective implements AfterViewInit, OnDestroy {
  @Input('MenuTriggerFor') menu?: MenuComponent;

  private _overlayRef: OverlayRef | null = null;
  private _isMenuOpen = false;

  private destroy$ = new Subject<void>();

  constructor(private renderer: Renderer2, private elementRef: ElementRef<HTMLElement>, private overlay: Overlay) { }

  @HostBinding('class') hostClass = 'vdm-menu-trigger';

  get nativeElement(): HTMLElement {
    return this.elementRef.nativeElement;
  }

  @HostListener('window:keyup.escape')
  escapeKeyEvent() {
    if (this._isMenuOpen) {
      this.closeMenu();
      this.nativeElement.focus();
    }
  }

  /** Enter key event triggers click event which opens menu,
   *  then focus is put on first item in the menu */
  @HostListener('window:keyup.enter', ['$event'])
  enterKeyEvent(event: KeyboardEvent) {
    if (this._isMenuOpen && document.activeElement === this.nativeElement) {
      event.stopImmediatePropagation();
      if (this.menu)
        this.menu.focusFirstItem();
    }
  }

  @HostListener('click')
  onClick() {
    this.toggleMenu();
  }

  public ngAfterViewInit(): void {
    this.renderer.setAttribute(this.nativeElement, 'role', 'button');
    this.renderer.setAttribute(this.nativeElement, 'aria-controls', `vdm-menu-${dropdownMenuUniqueId}`);
    if (this.menu) {
      this.menu.isClosedByKeyEvent.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.closeMenu();
        this.nativeElement.focus();
      });
    }
  }

  public ngOnDestroy(): void {
    this.destroy$.next();
    if (this._overlayRef) {
      this._overlayRef.dispose();
    }
  }

  private toggleMenu(): void {
    return this._isMenuOpen ? this.closeMenu() : this.openMenu();
  }

  private closeMenu(): void {
    this._isMenuOpen = false;
    if (this.menu)
      this.menu.close();
    if (this._overlayRef)
      this._overlayRef.detach();
  }

  private openMenu(): void {
    if (!this.menu) {
      return;
    }
    const overlayRef = this.createOverlay();
    overlayRef.attach(this.menu.menuPortal);
    this._isMenuOpen = true;
    this.menu.open();
  }

  private createOverlay(): OverlayRef {
    if (!this._overlayRef) {
      const config = this.getOverlayConfig();
      this._overlayRef = this.overlay.create(config);
    }
    this._overlayRef.backdropClick().subscribe(() => {
      this.closeMenu();
    });
    return this._overlayRef;
  }

  private getOverlayConfig(): OverlayConfig {
    return new OverlayConfig({
      positionStrategy: this.overlay
        .position()
        .flexibleConnectedTo(this.elementRef)
        .withLockedPosition()
        .withGrowAfterOpen()
        .withPositions([
          {
            // top-left of the overlay is connected to bottom-left of the origin;
            originX: 'start',
            originY: 'bottom',
            overlayX: 'start',
            overlayY: 'top',
          } as ConnectedPosition,
          {
            // bottom-left of the overlay is connected to top-left of the origin;
            originX: 'start',
            originY: 'top',
            overlayX: 'start',
            overlayY: 'bottom',
          } as ConnectedPosition,
          {
            // top-right of the overlay is connected to bottom-left of the origin;
            originX: 'start',
            originY: 'bottom',
            overlayX: 'end',
            overlayY: 'top',
          } as ConnectedPosition,
        ]),
      backdropClass: 'vdm-overlay-transparent-backdrop',
      hasBackdrop: true,
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });
  }
}

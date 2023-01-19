import { Directive, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { fromEvent, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

// tslint:disable-next-line: directive-selector
@Directive({ selector: '[vdmOutsideClick]' })
export class OutsideClickDirective implements OnInit, OnDestroy {
  private readonly destroySubject = new Subject();

  @Output('vdmOutsideClick')
  public outsideClick = new EventEmitter();

  /**
   * A boolean flag that will ignore the outside click.
   */
  @Input()
  public outsideClickIgnoreIf: boolean;

  /**
   * An array of element IDs to ignore.
   */
  @Input()
  public outsideClickIgnoreElements: string[];

  constructor(private readonly elementRef: ElementRef<HTMLElement>) {}

  public ngOnInit(): void {
    fromEvent(window, 'click', { capture: true })
      .pipe(takeUntil(this.destroySubject))
      .subscribe((event: MouseEvent) => {
        if (this.isClickOutside(event.target)) {
          this.outsideClick.emit();
        }
      });
  }

  public ngOnDestroy(): void {
    this.destroySubject.next();
  }

  private isClickOutside(node: any): boolean {
    if (this.outsideClickIgnoreIf) {
      return false;
    }
    const elements = [this.elementRef.nativeElement, ...this.getIgnoredElements()];
    return elements.every(e => !e?.contains(node));
  }

  private getIgnoredElements(): HTMLElement[] {
    if (!this.outsideClickIgnoreElements) {
      return [];
    }
    return this.outsideClickIgnoreElements.map(id => document.getElementById(id));
  }
}

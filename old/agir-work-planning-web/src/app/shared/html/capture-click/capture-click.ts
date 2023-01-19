import { Directive, ElementRef, EventEmitter, Output } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { BaseComponent } from '../../components/base/base.component';

/**
 * Represents a click event but sets the capture to true.
 */
@Directive({
  selector: '[appCaptureClick]'
})
export class CaptureClickDirective extends BaseComponent {
  // tslint:disable-next-line: no-output-rename
  @Output('appCaptureClick') public clicked = new EventEmitter<Event>();

  constructor(private readonly elementRef: ElementRef) {
    super();
    fromEvent(this.elementRef.nativeElement, 'click', { capture: true })
      .pipe(takeUntil(this.destroy$))
      .subscribe((x: Event) => this.clicked.emit(x));
  }
}

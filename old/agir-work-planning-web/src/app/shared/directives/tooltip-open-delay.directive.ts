import { Directive } from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

const DEFAULT_OPEN_DELAY = 1000;

/**
 * Directive that sets the default open delay for the tooltip.
 */
@Directive({
  // tslint:disable-next-line: directive-selector
  selector: '[ngbTooltip][openDelay]'
})
export class TooltipOpenDelayDirective {
  constructor(ngbTooltip: NgbTooltip) {
    const originalNgOnInit = ngbTooltip.ngOnInit;
    ngbTooltip.ngOnInit = function(this: NgbTooltip): void {
      if ((this.openDelay as any) === '') {
        this.openDelay = DEFAULT_OPEN_DELAY;
      }
      originalNgOnInit.bind(this)();
    };
  }
}

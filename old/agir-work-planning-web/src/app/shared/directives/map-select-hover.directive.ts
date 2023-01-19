import { Directive, HostListener, Input, OnDestroy } from '@angular/core';

import { MapHighlightService, ObjectToHighlight } from '../services/map-highlight/map-highlight.service';

@Directive({ selector: '[appMapHighlightHover]' })
export class MapHighlightHoverDirective implements OnDestroy {
  @Input('appMapHighlightHover') public objectToHighlight: ObjectToHighlight;

  constructor(private readonly mapHighlightHoverService: MapHighlightService) {}

  @HostListener('mouseenter')
  public onMouseEnter(): void {
    this.mapHighlightHoverService?.highlight(this.objectToHighlight);
  }

  @HostListener('mouseleave')
  public onMouseLeave(): void {
    this.mapHighlightHoverService?.unhighlight(this.objectToHighlight);
  }

  public ngOnDestroy(): void {
    this.onMouseLeave();
  }
}

import { OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { BaseComponent } from '../../shared/components/base/base.component';
import { MapService } from '../../shared/services/map.service';
import { RouteService } from '../../shared/services/route.service';

export abstract class BasePanelComponent extends BaseComponent implements OnInit {
  public shown = false;
  public isMapLoaded = false;

  @ViewChild(RouterOutlet) public outlet: RouterOutlet;

  constructor(
    private readonly routeService: RouteService,
    private readonly outletName: string,
    private readonly mapService: MapService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.outlet.activateEvents.subscribe(() => this.setShown(true));
    this.outlet.deactivateEvents.subscribe(() => this.setShown(false));
  }

  public close(): void {
    void this.routeService.clearOutlet(this.outletName);
    this.mapService.toggleBottomPanel(false);
  }

  /**
   * Sets the shown property.
   * Executes the code inside a setTimeout to prevent expression changed after it has been checked errors.
   * @param shown Whether the panel is shown or not
   */
  private setShown(shown: boolean): void {
    setTimeout(() => {
      this.shown = shown;
    });
  }
}

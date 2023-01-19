import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { map, startWith, takeUntil } from 'rxjs/operators';

import { MapOutlet } from '../../../shared/services/map-navigation.service';
import { MapPanelService } from '../../../shared/services/map-panel.service';
import { MapService } from '../../../shared/services/map.service';
import { RouteService } from '../../../shared/services/route.service';
import { BasePanelComponent } from '../base-panel.component';

const ASSET_SELECTION_ROUTE = 'asset-selection';
@Component({
  selector: 'app-map-left-panel',
  templateUrl: './map-left-panel.component.html',
  styleUrls: ['./map-left-panel.component.scss'],
  host: {
    '[class.panel-collapsed]': '!shown',
    '[class.full-size]': 'isFullSize'
  }
})
export class MapLeftPanelComponent extends BasePanelComponent implements OnInit, OnDestroy {
  public isFullSize = false;
  public isPanelLarger = false;
  public widthPanel: string = '';

  constructor(
    routeService: RouteService,
    private readonly mapPanelService: MapPanelService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    mapService: MapService
  ) {
    super(routeService, MapOutlet.leftPanel, mapService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.mapPanelService.mapLeftPanelComponent = this;
    this.getPanelSize();
  }

  public getPanelSize(): void {
    this.router.events
      .pipe(
        takeUntil(this.destroy$),
        map(() => this.activatedRoute.firstChild),
        startWith(this.activatedRoute.firstChild)
      )
      .subscribe(firstChild => {
        setTimeout(() => {
          this.isFullSize = Boolean(firstChild?.snapshot.data.fullSize);
          this.widthPanel = firstChild?.snapshot.data.widthPanel;
          this.isPanelLarger = Boolean((firstChild?.url as any)?.value[0]?.path === ASSET_SELECTION_ROUTE);
        });
      });
  }

  public closePanel(): void {
    if ((this.activatedRoute.firstChild as any)?.url?.value[0]?.path !== (ASSET_SELECTION_ROUTE as any)) {
      this.close();
    }
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.mapPanelService.mapLeftPanelComponent = null;
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapPanelService } from 'src/app/shared/services/map-panel.service';
import { RouteService } from 'src/app/shared/services/route.service';

import { MapService } from '../../../shared/services/map.service';
import { BasePanelComponent } from '../base-panel.component';

@Component({
  selector: 'app-left-panel-sub-panel',
  templateUrl: './left-panel-sub-panel.component.html',
  styleUrls: ['./left-panel-sub-panel.component.scss'],
  host: {
    '[class.panel-collapsed]': '!shown'
  }
})
export class MapLeftPanelSubPanelComponent extends BasePanelComponent implements OnInit, OnDestroy {
  constructor(routeService: RouteService, private readonly mapPanelService: MapPanelService, mapService: MapService) {
    super(routeService, 'leftPanelSubPanel', mapService);
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.mapPanelService.mapLeftPanelSubPanelComponent = this;
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.mapPanelService.mapLeftPanelSubPanelComponent = null;
  }
}

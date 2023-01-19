import { Component } from '@angular/core';

import { MapOutlet } from '../../../shared/services/map-navigation.service';
import { MapService } from '../../../shared/services/map.service';
import { RouteService } from '../../../shared/services/route.service';
import { BasePanelComponent } from '../base-panel.component';

@Component({
  selector: 'app-map-right-panel',
  templateUrl: './map-right-panel.component.html',
  styleUrls: ['./map-right-panel.component.scss'],
  host: {
    '[class.panel-collapsed]': '!shown'
  }
})
export class MapRightPanelComponent extends BasePanelComponent {
  constructor(routeService: RouteService, mapService: MapService) {
    super(routeService, MapOutlet.rightPanel, mapService);
  }
}

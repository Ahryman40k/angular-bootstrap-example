import { Component } from '@angular/core';
import { MapComponent } from '@villemontreal/maps-angular-lib';
import { takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { MapService } from 'src/app/shared/services/map.service';

import { layerManagerConfig } from '../config/layer-manager-config';

@Component({
  selector: 'app-map-layer-manager',
  templateUrl: './map-layer-manager.component.html',
  styleUrls: ['./map-layer-manager.component.scss']
})
export class MapLayerManagerComponent extends BaseComponent {
  public map: MapComponent;

  public configuration = layerManagerConfig;

  constructor(private readonly mapService: MapService) {
    super();
    this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => (this.map = this.mapService.map));
  }
}

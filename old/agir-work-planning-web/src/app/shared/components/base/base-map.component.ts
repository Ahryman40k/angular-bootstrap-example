import { ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MapComponent } from 'src/app/map/map.component';
import { BaseDetailsComponent } from 'src/app/window/base-details-component';
import { MapService } from '../../services/map.service';
import { WindowService } from '../../services/window.service';

export abstract class BaseMapComponent extends BaseDetailsComponent {
  public mapInitialized = false;

  @ViewChild('map') public map: MapComponent;

  constructor(
    protected windowService: WindowService,
    protected activatedRoute: ActivatedRoute,
    protected mapService: MapService
  ) {
    super(windowService, activatedRoute);
  }
}

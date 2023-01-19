import { Injector } from '@angular/core';
import { DynamicComponentService } from 'src/app/shared/services/dynamic-component.service';
import { LastRefreshComponent } from '../components/manual-refresh/last-refresh/last-refresh.component';

export class LastRefreshControl {
  private dynamicComponentService: DynamicComponentService;
  private injector: Injector;

  private map: mapboxgl.Map;
  constructor(dynamicComponentService: DynamicComponentService, injector: Injector) {
    this.dynamicComponentService = dynamicComponentService;
    this.injector = injector;
  }

  public onAdd(map: mapboxgl.Map): HTMLElement {
    this.map = map;
    return this.dynamicComponentService.injectComponent(
      LastRefreshComponent,
      this.injector,
      'mapboxgl-ctrl',
      'mapboxgl-ctrl-group',
      'm-0'
    ).html;
  }

  public onRemove(map: mapboxgl.Map): any {
    map.remove();
  }
}

import { Injector } from '@angular/core';
import { DynamicComponentService } from 'src/app/shared/services/dynamic-component.service';
import { ManualRefreshComponent } from '../components/manual-refresh/manual-refresh/manual-refresh.component';

export class ManualRefreshControl {
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
      ManualRefreshComponent,
      this.injector,
      'mapboxgl-ctrl',
      'mapboxgl-ctrl-group'
    ).html;
  }

  public onRemove(map: mapboxgl.Map): any {
    map.remove();
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { MapMouseEvent } from 'mapbox-gl';
import { interval } from 'rxjs';
import { throttle } from 'rxjs/operators';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

@Component({
  selector: 'vdm-lgnlat-viewer-tool',
  templateUrl: './lgnlat-viewer-tool.component.html',
  styleUrls: ['./lgnlat-viewer-tool.component.css']
})
export class LgnlatViewerToolComponent extends MapEventListener implements OnInit, OnDestroy {
  public lng: number;
  public lat: number;

  constructor() {
    super();
    this.lng = 0;
    this.lat = 0;
  }

  protected onMapLoaded() {
    this.targetMap
      .subscribeEvent('mousemove')
      .pipe(throttle(val => interval(50)))
      .subscribe((mouseEvent: MapMouseEvent) => {
        this.lat = mouseEvent.lngLat.lat;
        this.lng = mouseEvent.lngLat.lng;
      });

    // this.subscribeEvent('mousemove', (mouseEvent: MapMouseEvent) => {
    //   this.lat = mouseEvent.lngLat.lat;
    //   this.lng = mouseEvent.lngLat.lng;
    // });
  }
}

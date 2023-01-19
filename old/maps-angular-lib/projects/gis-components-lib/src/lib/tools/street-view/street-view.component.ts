// based on https://developers.google.com/maps/documentation/javascript/examples/streetview-simple
// Voir aussi https://developers.google.com/maps/documentation/javascript/streetview#StreetViewEvents

import { MapsAPILoader } from '@agm/core';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MapMouseEvent } from 'mapbox-gl';
import { ITool } from '../../models/tools/tool.model';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

@Component({
  selector: 'vdm-street-view',
  templateUrl: './street-view.component.html',
  styleUrls: ['./street-view.component.css']
})
export class StreetViewComponent extends MapEventListener implements OnInit, ITool {
  // Members for ITool
  public showOkCancel = true;
  public toolName: string = 'street-view';
  private modeInteraction = 'street-view';
  public isEditTool = false;

  @ViewChild('streetviewMap') protected streetviewMap: any;
  @ViewChild('streetviewPano') protected streetviewPano: any;
  @Input() public latitude: number = 42.345573;
  @Input() public longitude: number = -71.098326;
  @Input() public zoom: number = 11;
  @Input() public heading: number = 34;
  @Input() public pitch: number = 10;
  @Input() public scrollwheel: boolean = false;

  private panorama: any = null;

  constructor(private mapsAPILoader: MapsAPILoader) {
    super();
  }

  public async onMapLoaded() {
    this.targetMap.subscribeEvent('click', this.modeInteraction).subscribe((e: any) => this.onClick(e));

    await this.mapsAPILoader.load();
    const center = { lat: this.latitude, lng: this.longitude };

    // tslint:disable-next-line: no-string-literal
    this.panorama = new window['google'].maps.StreetViewPanorama(this.streetviewPano.nativeElement, {
      position: center,
      pov: { heading: this.heading, pitch: this.pitch },
      scrollwheel: this.scrollwheel
    });

    this.targetMap.addTool(this);
  }

  private onClick(mouseEvent: MapMouseEvent) {
    this.panorama.setPosition(mouseEvent.lngLat);
    this.panorama.setPov({
      heading: 265,
      pitch: 0
    });
  }

  private streetViewPositionChanged() {
    this.targetMap.map.setCenter({ lat: this.panorama.position.lat(), lng: this.panorama.position.lng() });
  }

  private clean() {
    // Effacer les événements qui on été ajoutés...
    // tslint:disable-next-line: no-string-literal
    window['google'].maps.event.clearListeners(this.panorama, 'position_changed');
    // tslint:disable-next-line: no-string-literal
    window['google'].maps.event.clearListeners(this.panorama, 'pov_changed');
  }

  public start(options: any, callback: (e: any) => void) {
    this.doneCallback = callback;

    // this.panorama.addListener('pov_changed', () => {
    //   // tslint:disable-next-line: no-console
    //   console.log(this.panorama.position, this.panorama.pov);
    // });

    this.panorama.addListener('position_changed', () => {
      this.streetViewPositionChanged();
    });

    this.targetMap.interactionMode = this.modeInteraction;
  }

  public cancel() {
    this.clean();
  }

  public done() {
    const pov = this.panorama.pov;

    this.clean();

    this.doneCallback({ position: { lat: this.panorama.position.lat(), lng: this.panorama.position.lng() }, pov });
  }
}

import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FeatureCollection } from 'geojson';
import { MapComponent } from '../../map/map.component';
import { IMapConfig } from '../../models';
import { MapEventListener } from '../../shared/component-classes/map-event-listener';

@Component({
  selector: 'vdm-minimap-tool',
  templateUrl: './minimap-tool.component.html',
  styleUrls: ['./minimap-tool.component.css']
})
export class MinimapToolComponent extends MapEventListener implements OnInit {
  @ViewChild('map') public map1: MapComponent;

  @Input() public mapConfig: IMapConfig;

  constructor() {
    super();
  }

  /**
   * subscribes targetMap to events
   * and sets starting coordinates for geojson
   * @protected
   * @memberof MapPairingComponent
   */
  protected onMapLoaded() {
    this.targetMap.subscribeEvent('drag').subscribe((e: any) => this.mapDragCallBack(e));
    this.targetMap.subscribeEvent('moveend').subscribe((e: any) => this.moveEndCallBack(e));
    this.targetMap.subscribeEvent('zoom').subscribe((e: any) => this.mapZoomCallBack(e));

    this.map1.subscribeEvent('drag').subscribe((e: any) => {
      this.targetMap.map.setCenter(this.map1.map.getCenter());
      this.updateMinimap();
    });

    // Setter le bon zoom et afficher le rectangle du viewport
    this.mapZoomCallBack(null);
  }

  private createFeatureFromPoint(mapCoordinates: any) {
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: mapCoordinates
          }
        }
      ]
    };
  }

  /**
   * Fired while dragging targetMap
   * Moves minimap (targetMap) to get same center as targetMap
   * Updates minimap's polygon
   * @protected
   * @param e
   * @memberof MapPairingComponent
   */
  protected mapDragCallBack(e: any) {
    this.map1.map.setCenter(this.targetMap.map.getCenter());
    this.updateMinimap();
  }

  /**
   * Fired while zooming targetMap (different from wheel event)
   * Updates minimap's polygon
   * @protected
   * @param e
   * @memberof MapPairingComponent
   */
  protected mapZoomCallBack(e: any) {
    let zoom = this.targetMap.map.getZoom();
    // const
    if (zoom > 13) {
      zoom = 13;
    }

    this.map1.map.setCenter(this.targetMap.map.getCenter());
    this.map1.map.setZoom(zoom);
    this.updateMinimap();
  }

  /**
   *
   *
   * @protected
   * @param e
   * @memberof MapPairingComponent
   */
  protected moveEndCallBack(e: any) {
    this.updateMinimap();
  }

  /**
   * Updates polygon of minimap (targetMap)
   * polygon represents targetMap view
   * coordinates of polygon change to match bounds of targetMap
   * @protected
   * @memberof MapPairingComponent
   */
  protected updateMinimap() {
    const mapBounds = this.getTargetMapCoordinates();
    (this.map1.map.getSource('minimap') as mapboxgl.GeoJSONSource).setData(this.createFeatureFromPoint(
      mapBounds
    ) as FeatureCollection);
  }

  /**
   * Formats targetMap bounds into coordinates arrays
   *
   * @protected
   * @returns Array composed of arrays containing lng, lat
   * @memberof MapPairingComponent
   */
  protected getTargetMapCoordinates() {
    const bounds = this.targetMap.map.getBounds();

    return [
      [
        [bounds.getWest(), bounds.getSouth()],
        [bounds.getWest(), bounds.getNorth()],
        [bounds.getEast(), bounds.getNorth()],
        [bounds.getEast(), bounds.getSouth()],
        [bounds.getWest(), bounds.getSouth()]
      ]
    ];
  }
}

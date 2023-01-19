import { Component, Input, OnInit } from '@angular/core';
import bbox from '@turf/bbox';
import booleanContains from '@turf/boolean-contains';
import booleanCrosses from '@turf/boolean-crosses';
import { Feature as ITurfFeature, feature as turfFeature, Geometry as ITurfGeometry } from '@turf/helpers';
import intersect from '@turf/intersect';

import { BBox, Feature, FeatureCollection, Geometry } from 'geojson';
import {
  Control,
  GeoJSONSource,
  IControl,
  Map as MapboxMap,
  MapboxGeoJSONFeature as MapboxFeature,
  Style
} from 'mapbox-gl';

import { BehaviorSubject, Observable, Subject } from 'rxjs';

import { ILayerZoomRange, ILogicLayer, IMapConfig, IScreenPoint } from '../models/';

import { ITool } from '../models/tools/tool.model';
import { DrawService } from '../services/draw.service';
import { StyleManagerService } from '../services/style-manager.service';

@Component({
  selector: 'vdm-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements OnInit {
  @Input() public id: string;
  @Input() public mapConfig: IMapConfig;

  public draw: DrawService;

  public map: MapboxMap;
  public isLoaded: boolean = false;
  public queryableLayers: string[] = [];
  public okCancelIsVisible: boolean = false;

  private _interactionMode: string = '';
  private eventSubscriptions: { [key: string]: Subject<any> };
  private mapSelectionContent: { [logicalLayerId: string]: Feature[] } = {};
  private styleManagerService: StyleManagerService;

  // Tools
  private tools: Map<string, ITool> = new Map<string, ITool>();
  public currentTool: ITool = null;

  constructor() {
    this.styleManagerService = new StyleManagerService();
    this.eventSubscriptions = {
      load: new BehaviorSubject<any>(false)
    };
  }

  public async ngOnInit() {
    await this.initMap();
  }

  /**
   * Inits map and publishes map load event for the other components
   */
  private async initMap(): Promise<void> {
    const style: Style = await this.styleManagerService.buildStyle(
      this.mapConfig.mapStyleDefinition,
      this.mapConfig.customMapSources,
      this.mapConfig.customMapLayers,
      this.mapConfig.baseUrl,
      this.mapConfig.spriteName
    );
    this.mapConfig.mapOptions.container = this.id;

    const options: mapboxgl.MapboxOptions = {
      ...this.mapConfig.mapOptions,
      style
    };

    // Hooks callback to add bearer for secured layers
    if (this.mapConfig.authRequestCallback) {
      options.transformRequest = (url, resourceType) => {
        const isSecured = url.includes('/secured/');
        if (isSecured) {
          const result = this.mapConfig.authRequestCallback(url, resourceType);

          return result;
        }
        return { url };
      };
    }

    this.map = new MapboxMap(options);
    this.map.on('load', () => {
      this.isLoaded = true;

      this.eventSubscriptions.load.next(true);
    });
  }

  public getDraw(): DrawService {
    if (!this.draw) {
      this.draw = new DrawService(this.map);
    }
    return this.draw;
  }

  public initDraw(drawProperties: any) {
    this.getDraw().init(drawProperties);
  }

  /**
   * Adds control
   * @param control
   * @param [position]
   */
  public addControl(
    control: Control | IControl,
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  ): void {
    this.map.addControl(control, position);
  }

  //#region Gestion des événements

  /**
   * Inits event
   * @param eventName
   */
  private initEvent(event: string, interactionMode?: string): string {
    let eventName: string = event;
    if (interactionMode && event !== 'load') {
      eventName = event + '.' + interactionMode;
    }
    if (eventName !== 'load' && !this.eventSubscriptions[eventName]) {
      this.eventSubscriptions[eventName] = new Subject<any>();
      this.map.on(event, (e: any) => {
        if (this.interactionMode === interactionMode || eventName === event) this.eventSubscriptions[eventName].next(e);
      });
    }
    return eventName;
  }

  /**
   * Dispatchs event
   * @param eventName
   * @param eventData
   */
  public dispatchEvent(eventName: string, eventData: any): void {
    this.map.fire(eventName, eventData);
  }

  /**
   * Subscribes event
   * @param eventName
   * @returns event
   */
  public subscribeEvent(event: string, interactionMode?: string): Observable<any> {
    return this.eventSubscriptions[this.initEvent(event, interactionMode)].asObservable();
  }

  /**
   * Gets interaction mode from private variable
   */
  public get interactionMode(): string {
    return this._interactionMode;
  }

  /**
   * Sets interaction mode
   */
  public set interactionMode(mode: string) {
    this._interactionMode = mode === '' ? undefined : mode;
  }
  //#endregion

  //#region Highlight and hover
  /**
   * Highlights map component
   * @param logicLayerId
   * @param featuresIds
   */
  public highlight(logicLayerId: string, featureIds: string[]): void {
    this.setStyleWithPrefixForIds(logicLayerId, 'highlight', featureIds);
  }

  /**
   * Set style by prefix for ids
   * @param logicLayerId
   * @param featuresIds
   */
  public setStyleWithPrefixForIds(logicLayerId: string, prefix: string, featureIds: string[]): void {
    const mapboxLayerIds: string[] = this.styleManagerService.getMapboxLayerIdsFromLogicLayer([logicLayerId]);

    for (const layerId of mapboxLayerIds) {
      if (layerId.startsWith(prefix + '-')) {
        this.setIdsOnFilterById(layerId, featureIds);
      }
    }
  }

  /**
   * Hover map component
   * @param logicLayerId
   * @param featuresIds
   */
  public hover(logicLayerId: string, featureIds: string[]): void {
    this.setStyleWithPrefixForIds(logicLayerId, 'hover', featureIds);
  }

  /**
   * Sets layer filter
   * @param layerId
   * @param featuresIds
   */
  private setIdsOnFilterById(layerId: string, featuresIds: string[]): void {
    let fixedFeatureId = [''];
    if (featuresIds.length > 0) {
      fixedFeatureId = featuresIds;
    }
    const filter: any[] = this.map.getFilter(layerId);
    if (filter) {
      for (const item of filter) {
        if (
          Array.isArray(item) &&
          item[0] === 'match' &&
          item[1][0] === 'to-string' &&
          item[1][1][0] === 'get' &&
          item[1][1][1] === 'id'
        ) {
          item[2] = fixedFeatureId;
          break;
        }
      }
    } else {
      // filter = ['all', ['match', ['to-string', ['get', 'id']], featuresIds, true, false]];
    }
    this.map.setFilter(layerId, filter);
  }
  //#endregion

  //#region Selection

  /**
   * Removes duplicate from an array. Items are considered duplicate if they have the same properties
   * @param arr
   * @returns duplicate
   */
  public removeDuplicatesFromArray(arr: any[]): any[] {
    const retour = {};
    arr.forEach((element: any) => {
      retour[JSON.stringify(element.properties)] = element;
    });
    const x = Object.values(retour);
    return x;
  }

  /**
   * Selects map features based on a geometry
   * If customQueryableLayers is not provided or empty, the query is done on all layers
   * Return a list of features group by logical layer with
   *
   * @param geometry
   * @param customQueryableLayers  the targets layers on which queryRenderFeature is call. The layers name are mapbox's layers ex: ['street-trees', 'sidewalks']
   * @returns
   */
  public intersect(geometry: Geometry, customQueryableLayers?: string[]): { [logicalLayerId: string]: Feature[] } {
    // Build feature and bbox from geometry
    const selectionFeature: Feature = this.geometryToFeature(geometry);
    const selectionBBox: BBox = this.featureToBBox(selectionFeature);

    // Convert bbox latlng positions to pixel points.
    const southWest = [selectionBBox[0], selectionBBox[1]];
    const northEast = [selectionBBox[2], selectionBBox[3]];
    const northEastPointPixel = this.map.project(northEast as any);
    const southWestPointPixel = this.map.project(southWest as any);

    const queryableLayers = customQueryableLayers ? customQueryableLayers : this.queryableLayers;

    // Gets features that intersect with the initial geometry(as feature)
    const rawFeatures: MapboxFeature[] = this.map.queryRenderedFeatures([southWestPointPixel, northEastPointPixel], {
      layers: this.styleManagerService.getMapboxLayerIdsFromLogicLayer(queryableLayers)
    });

    let features = rawFeatures.map(x => this.convertMapboxFeatureToFeature(x));

    features = this.removeDuplicatesFromArray(features);

    const selectedFeatures: Feature[] = features
      .map(feature => (this.isIntersect(feature, selectionFeature) ? feature : null))
      .filter(item => item);

    // Gets logic layers and dispatch MapSelectionContent event
    return this.groupByLogicLayersFromFeatures(selectedFeatures);
  }

  // public select(geometry: Geometry, customQueryableLayers?: string[]): IMapSelectionContent[] {
  //   const selectionContent = this.intersect(geometry, customQueryableLayers);
  //   this.mapSelectionContent = selectionContent;
  //   this.dispatchEvent('selectionChange', { selectionContent });
  //   return selectionContent;
  // }

  /**
   *
   * @param pointOrBox Selects the features group by logical layer, at x,y screen point within 'tolerance' pixels
   * @param tolerance
   */
  public selectFromPoint(pointOrBox: IScreenPoint, tolerance: number = 5): { [logicalLayerId: string]: Feature[] } {
    const selectionContent = this.queryFromPoint(pointOrBox, tolerance);
    this.mapSelectionContent = selectionContent;
    this.dispatchEvent('selectionChange', { selectionContent });
    return selectionContent;
  }

  /**
   * Return a list of features group by logical layer, at x,y screen point within 'tolerance' pixels
   * @param pointOrBox
   * @param [tolerance]
   * @returns from point
   */
  public queryFromPoint(pointOrBox: IScreenPoint, tolerance: number = 5): { [logicalLayerId: string]: Feature[] } {
    let screenPointBox = [];

    screenPointBox = [
      { x: pointOrBox.x - tolerance, y: pointOrBox.y - tolerance },
      { x: pointOrBox.x + tolerance, y: pointOrBox.y + tolerance }
    ];

    let queryableLayers = null;
    // TODO: On devrait recevoir les 'queryables layers' en paramètres et pas ceux de la carte au complet
    if (this.queryableLayers.length) {
      queryableLayers = this.styleManagerService.getMapboxLayerIdsFromLogicLayer(this.queryableLayers);
    }

    const mapboxFeatures: MapboxFeature[] = this.map.queryRenderedFeatures(
      [[screenPointBox[0].x, screenPointBox[0].y], [screenPointBox[1].x, screenPointBox[1].y]],
      {
        layers: queryableLayers
      }
    );

    let features = mapboxFeatures.map(x => this.convertMapboxFeatureToFeature(x));

    features = this.removeDuplicatesFromArray(features);

    // Get logic layers and dispatch MapSelectionContent event
    return this.groupByLogicLayersFromFeatures(features);
  }

  // /**
  //  * Gets logic layers from features
  //  * @param features
  //  * @returns logic layers from features
  //  * @deprecated
  //  */
  // private getLogicLayersFromFeatures(features: Feature[]): IMapSelectionContent[] {
  //   const featureFilter = [];
  //   for (const feature of features) {
  //     const logicLayerId: string | null = feature.properties.logicLayerId;
  //     if (logicLayerId) {
  //       featureFilter[logicLayerId]
  //         ? featureFilter[logicLayerId].push(feature)
  //         : (featureFilter[logicLayerId] = [feature]);
  //     }
  //   }
  //   return Object.keys(featureFilter).map(logicLayerId => {
  //     return {
  //       logicLayerId,
  //       features: featureFilter[logicLayerId]
  //     };
  //   });
  // }

  public convertMapboxFeatureToFeature(feature: MapboxFeature): Feature {
    return {
      properties: {
        ...feature.properties,
        logicLayerId: this.styleManagerService.getLogicLayerIdFromMapboxLayerId(feature.layer.id)
      },
      geometry: feature.geometry,
      type: feature.type,
      id: feature.id
    };
  }

  private groupByLogicLayersFromFeatures(features: Feature[]): { [key: string]: Feature[] } {
    const result: { [key: string]: Feature[] } = {};
    for (const feature of features) {
      const logicLayerId = feature.properties.logicLayerId;
      if (logicLayerId) {
        result[logicLayerId] ? result[logicLayerId].push(feature) : (result[logicLayerId] = [feature]);
      }
    }
    return result;
  }

  /**
   * Gets selected content
   * @returns selected content
   */
  public getSelectedContent(): { [logicalLayerId: string]: Feature[] } {
    return this.mapSelectionContent;
  }

  /**
   * Gets selected content
   * @returns selected content
   */
  public getSelectedContentSingle(): Feature {
    const layers = Object.keys(this.mapSelectionContent);
    if (layers && layers.length > 0) {
      const firstLayer = layers[0];
      const features = this.mapSelectionContent[firstLayer];
      return features[0];
    }
    return null;
  }
  //#endregion

  //#region Geomtry helper

  /**
   *
   * Custom features intersection  implementation by using @turf/intersect (for polygon-polygon)
   * @turf/boolean-contains, @turf/booleanCrosses,
   *
   * @param feature the feature to verify for intersection
   * @param compareFeature the feature on which to look for intersections, usually a polygon
   * @returns true if intersect
   */
  public isIntersect(feature: Feature, compareFeature: Feature): boolean {
    let result: boolean = false;

    // For turf/intersect, both feature have to be polygon
    if (compareFeature.geometry.type === 'Polygon' && feature.geometry.type === 'Polygon') {
      result = intersect(compareFeature as any, feature as any) !== null;
    }

    if (feature.geometry.type === 'LineString') {
      result = booleanContains(compareFeature, feature) || booleanCrosses(compareFeature, feature);
    }

    if (feature.geometry.type === 'Point') {
      result = booleanContains(compareFeature, feature);
    }

    return result;
  }

  /**
   * Features to bbox
   * @param feature
   * @returns to bbox
   */
  public featureToBBox(feature: Feature): BBox {
    return bbox(feature as ITurfFeature);
  }

  /**
   * Geometrys to feature
   * @param geometry
   * @returns to feature
   */
  public geometryToFeature(geometry: Geometry): Feature {
    return turfFeature(geometry as ITurfGeometry) as Feature;
  }

  public setSource(sourceId: string, features: FeatureCollection): void {
    const source: GeoJSONSource = this.map.getSource(sourceId) as GeoJSONSource;
    if (source) source.setData(features);
  }
  //#endregion

  //#region Layer visibility

  /**
   * Set layers visibility
   *
   * @param logicLayers the logic layers to toggle visibility
   * @param visible the layers display value: true to show layers, false to hide layers
   */
  public setLayerVisibility(logicLayers: string[], visible: boolean): void {
    if (logicLayers) {
      const mapboxLayersOfActiveTheme = this.styleManagerService.getMapboxLayerIdsFromLogicLayer(logicLayers);
      const mapboxLayersOfAllThemes = this.styleManagerService.getMapboxLayerIdsFromLogicLayerAllTheme(logicLayers);

      for (const mapboxLayer of mapboxLayersOfAllThemes) {
        const isActiveTheme = !!mapboxLayersOfActiveTheme.find(elem => elem === mapboxLayer);

        if (isActiveTheme) {
          if (visible) {
            this.map.setLayoutProperty(mapboxLayer, 'visibility', 'visible');
          } else {
            this.map.setLayoutProperty(mapboxLayer, 'visibility', 'none');
          }
        } else {
          this.map.setLayoutProperty(mapboxLayer, 'visibility', 'none');
        }
      }

      this.dispatchEvent('layerVisibilityChange', {
        display: visible,
        logicLayers
      });
    }
  }

  /**
   * check if logicLayer is visible by checking mapbox layers
   * make uniform all mapbox layers for a logic layer and return a boolean
   * @param logilayerId
   */
  public isLogicLayerVisible(logilayerId: string): boolean {
    return this.styleManagerService.isLogicLayerVisible(this.map, logilayerId);
  }

  /**
   * Determines wheher the layer and its parent LayerGroup must be visible or not depending on the current map zoom
   * @param logicLayerId
   */
  public isLayerVisibleAtCurrentZoom(layerZoomRange: ILayerZoomRange) {
    const currentZoom: number = this.map.getZoom();

    if (currentZoom <= layerZoomRange.maxzoom && currentZoom >= layerZoomRange.minzoom) {
      return true;
    }

    return false;
  }

  /**
   * Determines the max/min zoom for the Logic Layer based on the smallest/highest min/max zoom of its mapbox layers
   * @param logicLayerId
   */
  public determineLogicLayerZoomRange(logicLayerId: ILogicLayer['logicLayerId']): ILayerZoomRange {
    // These are the zoom ranges that come from the layer config
    let layerMinZoom: number = this.styleManagerService.getLayerMinZoom(logicLayerId);
    let layerMaxZoom: number = this.styleManagerService.getLayerMaxZoom(logicLayerId);

    if (!layerMinZoom) {
      layerMinZoom = this.map.getMinZoom();
    }

    if (!layerMaxZoom) {
      layerMaxZoom = this.map.getMaxZoom();
    }

    return { minzoom: layerMinZoom, maxzoom: layerMaxZoom };
  }
  //#endregion

  //#region Tools
  public addTool(tool: ITool) {
    this.tools[tool.toolName] = tool;
  }

  public useTool(toolName: string, usageDescription: string, doneCallBack: (e: any) => void, options: any) {
    // Fermer l'outil courrant
    if (this.currentTool) {
      this.currentTool.cancel();
    }

    const tool = this.tools[toolName];

    if (!tool) {
      // Outils manquant. Afficher un message d'erreur dans la console pour aider les développeurs
      // tslint:disable-next-line: no-console
      console.error(
        `Impossible de trouver '${toolName}' parmi les outils disponibles: ${Object.keys(
          this.tools
        )}.Assurez-vous d'enregistrer votre outils avec addTool ou de l'ajouter via le HTML du composant`
      );
    }

    this.currentTool = tool;
    this.currentTool.start(options, doneCallBack);

    this.dispatchEvent('toolChange', {
      tool,
      usageDescription
    });
  }

  public getAllTools(): Map<string, ITool> {
    return this.tools;
  }

  public onToolDone() {
    this.currentTool.done();
  }

  public onToolCancel() {
    this.currentTool.cancel();
  }

  public resetDraw(drawProperties: any) {
    this.draw.reset(drawProperties);
  }

  //#endregion

  //#region Themes
  public setCurrentTheme(logicLayerId: string, themeId: string) {
    // const isVisible = this.isLogicLayerVisible(logicLayerId);
    this.styleManagerService.setCurrentTheme(logicLayerId, themeId);
    this.setLayerVisibility([logicLayerId], true);
  }

  public getCurrentTheme(logicLayerId: string): string {
    return this.styleManagerService.getCurrentTheme(logicLayerId);
  }
  //#endregion
}

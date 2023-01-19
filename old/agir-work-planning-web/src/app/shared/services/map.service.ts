import { Injectable } from '@angular/core';
import { Params, Router } from '@angular/router';
import { BBox2d, Feature, LineString, Point } from '@turf/helpers/lib/geojson';
import * as turf from '@turf/turf';
import {
  AssetGeometryType,
  AssetType,
  IAsset,
  IGeometry,
  IMultiPolygon,
  IPolygon,
  Permission
} from '@villemontreal/agir-work-planning-lib';
import { MapComponent as LibMapComponent } from '@villemontreal/maps-angular-lib';
import { flatMap, isEmpty, isNil, omit, uniq } from 'lodash';
import { Layer, LngLatLike, Map as MapboxMap } from 'mapbox-gl';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { mapImages } from 'src/app/map/config/images';
import { LayerPrefix, LayerType } from 'src/app/map/config/layers/layer-enums';
import { MapLayers } from 'src/app/map/config/layers/map-enums';
import { filterAllFeaturesOut } from 'src/app/map/config/layers/utils';
import { MapComponent } from 'src/app/map/map.component';
import { IGlobalLayer } from 'src/app/map/panel/asset-layer/global-layer';
import {
  GLOBAL_LAYER_STORAGE_KEY,
  mapLayersVisibleByDefault
} from 'src/app/map/panel/asset-layer/map-layer-manager-config';
import { environment } from 'src/environments/environment';

import bboxPolygon from '@turf/bbox-polygon';
import { MapLogicLayer } from '../../map/config/layers/logic-layers/map-logic-layer-enum';
import { IMapboxLayerPatch } from '../models/map/mapbox-layer-patch';
import { NotificationsService } from '../notifications/notifications.service';
import { UserService } from '../user/user.service';
import { IAssetGroup } from './asset.service';
import { MapAssetLayerService } from './map-asset-layer.service';
import { ExternalReferenceIdType, NexoService } from './nexo.service';
import { SpatialAnalysisService } from './spatial-analysis.service';
import { UserLocalStorageService } from './user-local-storage.service';

const REFRESH_FLY_TO_THRESHOLD = 0.00000001;
const VIEWPORT_SCALE_FACTOR = 3;
const ASSET_MAX_ZOOM_BBOX_AREA = 49983; // area im m2 of the BBOX when zoom is at the limit of asset zoom as set in config

export enum MapFlyToSpeed {
  slow = 0.5,
  normal = 2,
  fast = 4
}

export enum MapZoomLevel {
  PROJECT = 16,
  INTERVENTION = 17
}

export enum FitZoomToGeometryPadding {
  NONE = 0,
  SMALL = 25,
  MEDIUM = 50,
  LARGE = 75
}

export enum SelectionMode {
  asset = 'asset',
  interventionArea = 'interventionArea',
  projectArea = 'projectArea',
  spider = 'spider'
}
export interface IProjectIntervalsFeatureCollections {
  pastProjectsFeatures: IProjectFeatures;
  presentProjectsFeatures: IProjectFeatures;
  futureProjectsFeatures: IProjectFeatures;
  multipleYearsProjectsFeatures: IProjectFeatures;
  multipleYearsPlannedProjectsFeatures: IProjectFeatures;
}
export interface IProjectFeatures {
  pinFeatures: turf.FeatureCollection;
  areaFeatures: turf.FeatureCollection;
}

export const EXTERNAL_ASSETS_LAYER = 'external-asset-layer';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private mapLoadedSubject: ReplaySubject<unknown>;
  public mapLoaded$: Observable<unknown>;

  public readonly bottomPanelSubject = new BehaviorSubject<{ isOpened: boolean; geometry?: IGeometry }>({
    isOpened: false
  });
  public bottomPanel$ = this.bottomPanelSubject.asObservable();

  public get bottomPanel(): { isOpened: boolean; geometry?: IGeometry } {
    return this.bottomPanelSubject.getValue();
  }

  public zoomSelect = true;
  public isSelectionActivated = false;

  public isLoadingRoadSection = false;

  public readonly selectedRoadSectionsSubject = new BehaviorSubject<any[]>([]);
  public selectedRoadSections$ = this.selectedRoadSectionsSubject.asObservable();

  public selectionMode: SelectionMode = SelectionMode.asset;
  public zoomLevel = environment.map.config.mapOptions.zoom;

  public viewport$: Observable<turf.BBox>;
  public viewportScaled$: Observable<turf.BBox>;
  public zoom$: Observable<number>;

  private _map: LibMapComponent;

  public mapComponent: MapComponent;

  public get map(): LibMapComponent {
    return this._map;
  }
  public set map(v: LibMapComponent) {
    this._map = v;

    if (!v) {
      this.initMapLoadedSubject();
      return;
    }

    v.subscribeEvent('load').subscribe(loaded => {
      if (!loaded || !this.map) {
        return;
      }
      void this.initMap();
    });
  }

  public get mapboxMap(): MapboxMap {
    return this.map?.map;
  }

  public get viewport(): turf.BBox {
    if (!this.mapboxMap) {
      return null;
    }
    const currentBound = this.mapboxMap.getBounds();

    const sw = currentBound.getSouthWest();
    const ne = currentBound.getNorthEast();

    const line = turf.lineString([
      [sw.lng, sw.lat],
      [ne.lng, ne.lat]
    ]);
    const bbox = turf.bbox(line);

    return bbox;
  }

  public get viewportScaled(): turf.BBox {
    if (!this.viewport) {
      return null;
    }
    return this.spatialAnalysisService.scaleBbox(this.viewport, VIEWPORT_SCALE_FACTOR);
  }

  public get zoom(): number {
    return this.mapboxMap?.getZoom();
  }

  constructor(
    private readonly userLocalStorageService: UserLocalStorageService,
    private readonly notificationsService: NotificationsService,
    private readonly spatialAnalysisService: SpatialAnalysisService,
    private readonly mapAssetLayerService: MapAssetLayerService,
    private readonly router: Router,
    private readonly userService: UserService
  ) {
    this.initMapLoadedSubject();
  }

  private async initMap(): Promise<void> {
    await this.loadImages();

    // this.map is a child component, which can be modified to null when changing item on project detail
    this.viewport$ = this.map?.subscribeEvent('move')?.pipe(map(() => this.viewport));
    this.viewportScaled$ = this.viewport$?.pipe(map(() => this.viewportScaled));
    this.zoom$ = this.map?.subscribeEvent('move')?.pipe(map(() => this.zoom));
    await this.setMapAssetLogicLayerGroupsVisibility();

    if (this.map) {
      this.mapLoadedSubject.next();
    }
  }

  private async setMapAssetLogicLayerGroupsVisibility(): Promise<void> {
    if (!this.map) {
      return;
    }
    const enabledLogicLayerGroups = await this.mapAssetLayerService
      .getEnabledLogicLayerGroups()
      .pipe(take(1))
      .toPromise();
    const enabledLogicLayerGroupIds = Object.keys(enabledLogicLayerGroups);

    const layerSubGroupsFromLocalStorage = await this.userLocalStorageService.get<IGlobalLayer>(
      GLOBAL_LAYER_STORAGE_KEY
    );
    const visibleLayersByUserOptions = flatMap(layerSubGroupsFromLocalStorage);
    const visibleLogicLayerGroupIds = [...visibleLayersByUserOptions, ...mapLayersVisibleByDefault];

    await this.setLayerVisibility(enabledLogicLayerGroupIds, false);
    await this.setLayerVisibility(visibleLogicLayerGroupIds, true);
  }

  private initMapLoadedSubject(): void {
    this.mapLoadedSubject = new ReplaySubject(1);
    this.mapLoaded$ = this.mapLoadedSubject.asObservable();
  }

  public setPointer(activate: boolean): void {
    if (!this.mapboxMap) {
      return;
    }
    this.mapboxMap.getCanvas().style.cursor = activate ? 'pointer' : '';
  }

  public isGeometryValid(geometry: IGeometry): boolean {
    if (this.isGeometryPoint(geometry)) {
      return true;
    }
    if (this.isGeometryLine(geometry)) {
      return true;
    }

    const geometries: IGeometry[] = this.getPolygonGeometryList(geometry);
    return !this.hasKinksPolygons(geometries);
  }

  public isProjectAreaIncludingInterventions(projectArea: IGeometry): boolean {
    const geometries: IGeometry[] = this.getPolygonGeometryList(projectArea);
    return !this.hasKinksPolygons(geometries);
  }

  private getPolygonGeometryList(geometry: IGeometry): IGeometry[] {
    if (geometry.type === 'Polygon') {
      return [geometry];
    }
    const polygons: IGeometry[] = [];
    const multiPolygon = geometry.coordinates as IMultiPolygon;
    multiPolygon.forEach((mp: IPolygon) => {
      polygons.push({
        type: 'Polygon',
        coordinates: mp
      });
    });
    return polygons;
  }

  private hasKinksPolygons(geometries: IGeometry[]): boolean {
    const hasKinkPolygons = geometries
      .map(geometry => {
        const poly = turf.polygon(geometry.coordinates as any);
        const kinks = turf.kinks(poly);
        return kinks.features.length === 0;
      })
      .filter(x => !x);
    return !isEmpty(hasKinkPolygons);
  }

  public isGeometryPoint(geometry: IGeometry): boolean {
    return (
      geometry &&
      geometry.coordinates &&
      geometry.coordinates instanceof Array &&
      geometry.coordinates.length <= 3 &&
      geometry.coordinates.every(n => typeof n === 'number')
    );
  }

  public isGeometryLine(geometry: IGeometry): boolean {
    return (
      geometry &&
      geometry.coordinates &&
      geometry.coordinates instanceof Array &&
      geometry.coordinates.length > 0 &&
      geometry.coordinates.every(c => {
        return c instanceof Array && c.length <= 3 && c.every(n => typeof n === 'number');
      })
    );
  }

  public goToGeometryCenter(geometry: IGeometry, zoomLevel: MapZoomLevel = MapZoomLevel.INTERVENTION): void {
    if (!this.mapboxMap) {
      return;
    }
    const center = turf.center(geometry);

    const zoom = this.zoomLevel < MapZoomLevel.INTERVENTION ? zoomLevel : this.zoomLevel;
    this.mapboxMap.setCenter(center.geometry.coordinates as LngLatLike);
    this.mapboxMap.setZoom(zoom);
  }

  public fitZoomToGeometry(
    geometry: turf.AllGeoJSON,
    padding: FitZoomToGeometryPadding = FitZoomToGeometryPadding.MEDIUM,
    animate = false,
    maxZoom?: number
  ): void {
    if (!this.mapboxMap) {
      return;
    }
    const bbox = turf.bbox(geometry) as BBox2d;
    const mapPadding = this.getMapZoomPadding(padding);
    const options: mapboxgl.FitBoundsOptions = {
      padding: mapPadding,
      animate
    };
    // Need to assign optional properties one by one
    // because mapbox checks for keys instead of values.
    if (maxZoom !== undefined) {
      options.maxZoom = maxZoom;
    }
    this.mapboxMap.fitBounds(bbox, options);
  }

  private async loadImages(): Promise<void> {
    if (!this.map) {
      return;
    }
    const localMap = this.mapboxMap;
    await Promise.all(
      mapImages.map(
        icon =>
          new Promise<void>(resolve => {
            if (localMap.hasImage(icon.id)) {
              resolve();
              return;
            }
            localMap.loadImage(icon.fileName, (error, image) => {
              if (error) {
                this.notificationsService.showError("Impossible de charger l'image: " + icon.fileName);
              }
              if (image && !localMap.hasImage(icon.id)) {
                localMap.addImage(icon.id, image);
              }
              resolve();
            });
          })
      )
    );
  }

  /**
   * Sets the layers visibilities.
   * Pass trough to the map component.
   * Adds a fail fast mechanism to prevent invalid layers.
   * @param logicLayerIds The logic layer IDs.
   * @param checked The value to set.
   */
  public async setLayerVisibility(logicLayerIds: string[], checked: boolean): Promise<void> {
    if (!((await this.userService.hasPermission(Permission.ASSET_READ)) && this.map)) {
      return;
    }

    this.validateLayerIds(logicLayerIds);
    this.map.setLayerVisibility(logicLayerIds, checked);
  }

  public getLayers(layerIds: string[]): mapboxgl.Layer[] {
    return layerIds.map(id => this.mapboxMap?.getLayer(id)).filter(l => l);
  }

  public patchLayers(layerIds: string[], patch: IMapboxLayerPatch): void {
    const layers = this.getLayers(layerIds);
    for (const layer of layers) {
      Object.assign(layer, patch);
    }
  }

  public setLayersZoomRange(layerIds: string[], minZoom?: number, maxZoom?: number): void {
    if (!this.mapboxMap) {
      return;
    }
    for (const layerId of layerIds) {
      this.mapboxMap.setLayerZoomRange(layerId, minZoom, maxZoom);
    }
  }

  /**
   * Validates the layer IDs.
   * If the layer ID doesn't exist, it throws an exception.
   * @param logicLayerIds The log layer Ids
   */
  private validateLayerIds(logicLayerIds: string[]): void {
    if (!this.map) {
      return;
    }
    const layerIds = Object.keys(this.map.mapConfig.customMapLayers);
    for (const logicLayerId of logicLayerIds) {
      if (!layerIds.includes(logicLayerId)) {
        throw new Error('Invalid layer ID: ' + logicLayerId);
      }
    }
  }

  public setSelectionMode(selectionMode: SelectionMode): void {
    this.selectionMode = selectionMode;
  }

  public activateSelectionModeUI(): void {
    this.isSelectionActivated = true;
  }

  public deactivateSelectionModeUI(): void {
    this.isSelectionActivated = false;
  }

  /**
   * Refreshes the map.
   * Forces a re-draw of the map by moving.
   * Quick and dirty trick
   */
  public refreshMap(): void {
    if (!this.mapboxMap) {
      return;
    }
    const center = this.mapboxMap.getCenter();
    center.lng += REFRESH_FLY_TO_THRESHOLD;
    this.mapboxMap.flyTo({ animate: true, center });
  }

  public setZoom(zoom: number): void {
    this.mapboxMap?.setZoom(zoom);
  }

  public activateRoadSectionSelection(): void {
    this.map.useTool(
      'simpleSelection',
      'Choisissez des tronçons',
      (e: any) => {
        if (this.isLoadingRoadSection) {
          return;
        }
        if (e.roadSectionsSelection?.length) {
          const newElement = e.roadSectionsSelection[0];
          if (
            this.selectedRoadSectionsSubject.value.find(
              roadSection => JSON.stringify(roadSection.geometry) === JSON.stringify(newElement.geometry)
            )
          ) {
            return;
          }
          this.selectedRoadSectionsSubject.next([...this.selectedRoadSectionsSubject.value, newElement]);
        }
      },
      {
        queryableLayers: [MapLogicLayer.roadSectionsSelection]
      }
    );
  }

  public clearRoadSectionsSelection(): void {
    this.selectedRoadSectionsSubject.next([]);
  }

  private getMapZoomPadding(minPadding: FitZoomToGeometryPadding): mapboxgl.PaddingOptions {
    const padding = {
      left: minPadding,
      top: minPadding,
      right: minPadding,
      bottom: minPadding
    };
    if (!this.map) {
      return padding;
    }
    padding.left += this.mapComponent.paddingLeft;
    padding.right += this.mapComponent.paddingRight;
    return padding;
  }

  public showProjectAssets(assetTypeAndIdsToLogicLayers: { type: string; ids: string[]; logicLayer: string }[]): void {
    for (const assetTypeAndIdsToLogicLayer of assetTypeAndIdsToLogicLayers) {
      if (assetTypeAndIdsToLogicLayer.ids.length) {
        this.setMapLayerStyleWithPrefixForIds(
          assetTypeAndIdsToLogicLayer.logicLayer,
          LayerPrefix.PROJECT,
          assetTypeAndIdsToLogicLayer.ids
        );
      }
    }
  }

  public setMapLayerStyleWithPrefixForIds(logicLayerId: string, prefix: string, featureIds: string[]): void {
    if (!logicLayerId) {
      return;
    }
    if (logicLayerId.includes(EXTERNAL_ASSETS_LAYER)) {
      // Handle external Layers
      const externalLayer = this.mapboxMap.getLayer(logicLayerId);
      if (externalLayer) {
        this.mapboxMap.setFilter(externalLayer.id, ['match', ['get', 'id'], featureIds, true, false]);
      }
    } else {
      this.map?.setStyleWithPrefixForIds(logicLayerId, prefix, featureIds);
    }
  }

  public setMapLayerFilter(mapLayer: string, filter: mapboxgl.Expression): void {
    if (!this.mapboxMap.getLayer(mapLayer)) {
      return;
    }
    this.mapboxMap?.setFilter(mapLayer, filter);
  }

  public hideAllMapAssets(): void {
    for (const mapLayer of Object.values(MapLayers)) {
      this.setMapLayerFilter(mapLayer, filterAllFeaturesOut());
    }
  }

  /**
   * Combine duplicated logic layer feature ids.
   * ex: [{logicLayer: 'x', ids: [1,2]}, {logicLayer: 'x', ids: [3, 4]}] => [{logicLayer: 'x', ids: [1,2,3,4]}]
   */
  public groupAssetTypeIdsByLogicLayer(
    assetTypeAndIdsToLogicLayers: { type: string; ids: string[]; logicLayer: string }[]
  ): { type: string; ids: string[]; logicLayer: string }[] {
    return Object.values(
      assetTypeAndIdsToLogicLayers.reduce((c, { logicLayer, type, ids }) => {
        c[logicLayer] = c[logicLayer] || { logicLayer, type, ids: [] };
        c[logicLayer].ids = c[logicLayer].ids.concat(Array.isArray(ids) ? ids : [ids]);
        c[logicLayer].ids = c[logicLayer].ids.filter(id => !isNil(id) && id !== '0');
        return c;
      }, {})
    );
  }

  public toggleBottomPanel(isOpened: boolean, geometry?: IGeometry): void {
    this.bottomPanelSubject.next({ isOpened, geometry: !isOpened ? null : geometry });
  }

  public viewMap(queryParams: Params): void {
    void this.router.navigate(['map'], queryParams);
  }

  /**
   * Move targetted layers below asset layers
   * @param targetLayerIds Layers to move
   * @param assetLayerIds Asset layers that should be above
   */
  public moveAssetLayers(targetLayerIds: string[], assetLayerIds: string[]): void {
    if (!this.mapboxMap) {
      return; // return when quickly switching from overview to any other menu item
    }
    const allLayers = this.mapboxMap.getStyle().layers;
    const orderedAssetIds = assetLayerIds.sort((a, b) => {
      const aId = allLayers.findIndex(layer => layer.id === a);
      const bId = allLayers.findIndex(layer => layer.id === b);
      return aId - bId;
    });

    targetLayerIds.forEach(targetLayer => this.mapboxMap.moveLayer(targetLayer, orderedAssetIds[0]));
  }

  public resetAssetLayers(): void {
    // Hide all asset layers - Fixes an issue in which assets remain visible when switching between interventions in a project
    this.hideAllMapAssets();

    this.mapAssetLayerService.getEnabledLogicLayerIds().subscribe(async layers => {
      await this.setLayerVisibility(layers, false);
      layers.forEach(layer => {
        this.setMapLayerStyleWithPrefixForIds(layer, LayerPrefix.PROJECT, []);
      });
    });
  }

  public showAssetGroups(assetGroups: IAssetGroup[]): void {
    assetGroups.forEach(assetGroup => {
      this.mapAssetLayerService
        .getLogicLayerIdFromAssetType(assetGroup.type)
        .pipe(take(1))
        .subscribe(async logicLayer => {
          if (logicLayer) {
            await this.setLayerVisibility([logicLayer], true);
            this.setMapLayerStyleWithPrefixForIds(logicLayer, LayerPrefix.PROJECT, assetGroup.ids);
          }
        });
    });
  }

  /**
   * Move targetted layers below asset groups
   * @param targetLayerIds Layers to move
   * @param assetGroups Asset groups that should be above
   */
  public moveAssetGroupLayers(targetLayerIds: string[], assetGroups: IAssetGroup[]): void {
    const sourceLayers: string[] = [];
    assetGroups.forEach((assetGroup, index) => {
      this.mapAssetLayerService
        .getSourceLayerIdFromAssetType(assetGroup.type)
        .pipe(take(1))
        .subscribe(sourceLayer => {
          sourceLayers.push(sourceLayer);

          if (assetGroups.length === index + 1) {
            // If we are on last assetGroup we can move layers
            this.moveAssetLayers(targetLayerIds, sourceLayers);
          }
        });
    });
  }

  /**
   * Add dynamically layers to map given unregistered assets in geomatic api
   */
  public addExternalAssetsLayer(assets: IAsset[]) {
    // Group assets by asset type and by geometry type
    const assetGroupTypes = uniq(assets.map(a => a.typeId as AssetType));
    const assetGeometryTypes = uniq(assets.map(a => a.geometry.type));

    const assetGroups: {
      type: AssetType;
      assets: IAsset[];
    }[] = [];

    for (const assetGroupType of assetGroupTypes) {
      for (const geometryType of assetGeometryTypes) {
        const assetsInGroup = assets.filter(a => a.typeId === assetGroupType && a.geometry.type === geometryType);
        if (assetsInGroup.length) {
          assetGroups.push({
            type: assetGroupType,
            assets: assetsInGroup
          });
        }
      }
    }

    /**
     * for each asset type, duplicate all existing layers and add external assets geometries
     * (basic, project, highlight, hover)
     */
    assetGroups.forEach(assetGroup => {
      this.mapAssetLayerService
        .getSourceLayerIdFromAssetType(assetGroup.type)
        .pipe(take(1))
        .subscribe(sourceLayer => {
          const assetTypeLayers = this.getLayersForAssetsOfSourceLayer(assetGroup.assets, sourceLayer);

          assetTypeLayers.forEach((assetTypeLayer, i) => {
            const features: any = assetGroup.assets.map(asset => {
              const id = NexoService.getExternalReferenceIdByTypes(asset, [
                ExternalReferenceIdType.nexoAssetId,
                ExternalReferenceIdType.nexoReferenceNumber
              ]);
              return {
                type: 'Feature',
                geometry: asset?.geometry,
                id,
                properties: { id }
              };
            });
            const layerSource: any = {
              type: 'geojson',
              data: turf.featureCollection(features) as GeoJSON.FeatureCollection
            };
            const geometryType = (layerSource.data as GeoJSON.FeatureCollection).features.length
              ? (layerSource.data as GeoJSON.FeatureCollection).features[0].geometry.type
              : '';
            const externalLayer = {
              ...omit(assetTypeLayer, 'source-layer'),
              id: `${assetTypeLayer.id}-${geometryType.toLowerCase()}-${EXTERNAL_ASSETS_LAYER}`,
              source: layerSource,
              layout: {
                ...assetTypeLayer.layout,
                visibility: 'visible'
              },
              metadata: {
                assetType: assetGroup.type
              }
            } as Layer;

            if (assetTypeLayer.id.includes('project')) {
              this.mapComponent.hoverService.initHoveredAssetFeaturesSubject([externalLayer.id]);
            }

            if (externalLayer.filter.includes('to-boolean')) {
              delete externalLayer.filter;
            }

            this.mapboxMap.addLayer(externalLayer);
          });
        });
    });
  }

  public getExternalLayers(layerPrefix?: LayerPrefix): Layer[] {
    return !this.mapboxMap
      ? []
      : this.mapboxMap
          .getStyle()
          .layers.filter(layer => layer.id.includes(EXTERNAL_ASSETS_LAYER))
          .filter(layer => {
            if (layerPrefix) {
              if (layer.id.includes(layerPrefix)) {
                return layer;
              }
            } else {
              return layer;
            }
          });
  }

  /**
   * check if the area of the bbox of a feature is greater than the area
   * of the bbox of the cureent view  when the zoom is at the limit of the zoom of the asset as set in the  config
   *
   * @param {IGeometry} geometry
   * @returns {boolean}
   * @memberof MapService
   */
  public isOverSizedFeature(geometry: IGeometry): boolean {
    const assetBbox = bboxPolygon(turf.bbox(geometry));
    return ASSET_MAX_ZOOM_BBOX_AREA - turf.area(assetBbox) < 0;
  }

  /**
   *
   * Get the intersection of a line and the current viewport of the map
   * as a LineString
   * @param {IGeometry} geometry
   * @returns  Feature<LineString>
   * @memberof MapService
   */
  public getIntersectionFeature(geometry: IGeometry): Feature<LineString | Point> {
    if (geometry.type !== 'LineString') {
      return null;
    }
    const mapBbox = bboxPolygon(this.viewport);
    const intersect = turf.lineIntersect(geometry as any, mapBbox);
    if (!intersect || intersect.features.length < 1) {
      return null;
    }

    if (intersect.features.length === 1 && intersect.features[0].geometry.type === 'Point') {
      return intersect.features[0];
    }

    return turf.lineString(
      intersect.features.map(feat => {
        return feat.geometry.coordinates;
      })
    );
  }

  private getLayersForAssetsOfSourceLayer(assets: IAsset[], sourceLayer: string): Layer[] {
    const layersOnMap = this.mapboxMap.getStyle().layers;
    let assetTypeLayers = layersOnMap.filter(item => item['source-layer'] === sourceLayer);
    if (!assets.length) return assetTypeLayers;

    // Select type of the geometry from the main layer for the specified sourceLayer
    const expectedGeometryType = assetTypeLayers.find(layer => Object.values<string>(MapLayers).includes(layer.id))
      ?.type;

    /* Select default layers associated with the assets' geometry type
    if the geometry type of the assets doesn't match the expected geometry type
    of the currently selected layers (the geometry type of the main layer in assetTypeLayers) */
    switch (assets[0].geometry.type) {
      case AssetGeometryType.Point:
        if (expectedGeometryType !== LayerType.SYMBOL) {
          assetTypeLayers = layersOnMap.filter(item => item['source-layer'] === MapLayers.WATER_SERVICE_ENTRANCES);
        }
        break;
      case AssetGeometryType.LineString:
      case AssetGeometryType.MultiLineString:
        if (expectedGeometryType !== LayerType.LINE) {
          assetTypeLayers = layersOnMap.filter(item => item['source-layer'] === MapLayers.AQUEDUCS);
        }
        break;
      case AssetGeometryType.Polygon:
        if (
          !expectedGeometryType ||
          expectedGeometryType === LayerType.SYMBOL ||
          expectedGeometryType === LayerType.LINE
        ) {
          assetTypeLayers = layersOnMap.filter(item => item['source-layer'] === MapLayers.GREEN_SPACE);
        }
        break;
      default:
        // Unknown geometry type
        break;
    }
    return assetTypeLayers;
  }
}

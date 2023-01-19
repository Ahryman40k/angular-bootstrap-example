import { Injectable, Injector, Type } from '@angular/core';
import { IAsset, IEnrichedIntervention, IFeature, Permission } from '@villemontreal/agir-work-planning-lib';
import { MapComponent } from '@villemontreal/maps-angular-lib';
import { first, isEqual, uniqBy } from 'lodash';
import { Anchor, LngLat, Point, Popup } from 'mapbox-gl';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { debounceTime, filter, take } from 'rxjs/operators';
import {
  addressLayerIds,
  countByBoroughLayerIds,
  interventionLayerIds,
  plannedProjectLayerIds,
  postponedProjectLayerIds,
  projectLayerIds,
  replannedProjectLayerIds,
  rtuProjectLayerIds
} from 'src/app/map/config/layers/map-enums';
import { AddressPopupComponent } from 'src/app/map/popups/address-popup/address-popup.component';
import { BasePopupComponent } from 'src/app/map/popups/base-popup.component';
import { BoroughCountPopupComponent } from 'src/app/map/popups/borough-count-popup/borough-count-popup.component';
import { ClusterPopupComponent } from 'src/app/map/popups/cluster-popup/cluster-popup.component';
import { InterventionPopupComponent } from 'src/app/map/popups/intervention-popup/intervention-popup.component';
import { ProjectPopupComponent } from 'src/app/map/popups/project-popup/project-popup.component';

import { LayerPrefix } from '../../map/config/layers/layer-enums';
import { AssetPopupComponent } from '../../map/popups/asset-popup/asset-popup.component';
import { RtuProjectPopupComponent } from '../../map/popups/rtu-project-popup/rtu-project-popup.component';
import { ObjectType } from '../models/object-type/object-type';
import { UserService } from '../user/user.service';
import { AssetService } from './asset.service';
import { DynamicComponentService, IDynamicComponentResult } from './dynamic-component.service';
import { MapAssetLayerService } from './map-asset-layer.service';
import { MapService } from './map.service';
import { ObjectTypeModel, ObjectTypeService } from './object-type.service';

const POPUP_CLOSE_TIMER = 500;
const POPUP_OPEN_TIMER = 1000;
const POPUP_MAP_REFRESH_THRESHOLD = 100;

interface IMapboxglPopupOptionsExtended extends mapboxgl.PopupOptions {
  maxWidth?: string;
}

@Injectable({
  providedIn: 'root'
})
export class MapPopupService {
  private mapComponent: MapComponent;

  private lastMouseCoordinatesLngLat: LngLat;
  private lastMouseCoordinatesInCanvas: Point;
  private popup: Popup;
  private isRefreshingMapForPopup: boolean;

  private readonly hoveredFeaturesSubject = new BehaviorSubject<mapboxgl.MapboxGeoJSONFeature[]>([]);
  public hoveredFeatures$ = this.hoveredFeaturesSubject.asObservable();

  private readonly popupHoveredSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private readonly dynamicComponentService: DynamicComponentService,
    private readonly mapService: MapService,
    private readonly injector: Injector,
    private readonly objectTypeService: ObjectTypeService,
    private readonly assetService: AssetService,
    private readonly mapAssetLayerService: MapAssetLayerService,
    private readonly userService: UserService
  ) {}

  public async init(
    mapComponent: MapComponent,
    isPopupsEnabled: boolean,
    disabledObjects: ObjectType[]
  ): Promise<void> {
    this.mapComponent = mapComponent;

    this.mapComponent.subscribeEvent('mousemove').subscribe(e => {
      this.lastMouseCoordinatesLngLat = e.lngLat;
      this.lastMouseCoordinatesInCanvas = e.point;
    });

    this.mapComponent
      .subscribeEvent('move')
      .pipe(filter(() => !this.isRefreshingMapForPopup))
      .subscribe(() => this.closePopup());

    let layerIds = [];
    if (await this.userService.hasPermission(Permission.ASSET_READ)) {
      layerIds = await this.mapAssetLayerService
        .getEnabledLayerIds()
        .pipe(take(1))
        .toPromise();
    }

    this.initHoveredFeaturesSubject([
      ...interventionLayerIds,
      ...projectLayerIds,
      ...plannedProjectLayerIds,
      ...replannedProjectLayerIds,
      ...postponedProjectLayerIds,
      ...rtuProjectLayerIds,
      ...addressLayerIds,
      ...countByBoroughLayerIds,
      ...layerIds
    ]);

    this.initOpenPopup(isPopupsEnabled, disabledObjects);
    this.initClosePopup();
    this.initPointer();
  }

  private initHoveredFeaturesSubject(popupLayers: string[]): void {
    this.mapComponent.map.on('mousemove', e => {
      const features = this.mapComponent.map.queryRenderedFeatures(e.point, { layers: popupLayers });
      if (!isEqual(this.hoveredFeaturesSubject.value, features)) {
        this.hoveredFeaturesSubject.next(features);
      }
    });
  }

  private initOpenPopup(isPopupsEnabled: boolean, disabledObjects: ObjectType[]): void {
    this.hoveredFeaturesSubject.pipe(debounceTime(POPUP_OPEN_TIMER)).subscribe(async features => {
      if (isPopupsEnabled) {
        const noDuplicateFeatures = uniqBy(features, f => f.properties.id);
        await this.showPopup(noDuplicateFeatures, disabledObjects);
      }
    });
  }

  private initClosePopup(): void {
    combineLatest(this.hoveredFeaturesSubject, this.popupHoveredSubject)
      .pipe(debounceTime(POPUP_CLOSE_TIMER))
      .subscribe(([features, popupHovered]) => {
        if (features.length === 0 && !popupHovered) {
          this.closePopup();
        }
      });
  }

  private initPointer(): void {
    this.hoveredFeaturesSubject.subscribe(f => {
      this.mapService.setPointer(f.length > 0);
    });
  }

  private async showPopup(features: mapboxgl.MapboxGeoJSONFeature[], disabledObjects: ObjectType[]): Promise<void> {
    if (!this.mapService.mapComponent?.popupsEnabled || this.popupHoveredSubject.value) {
      return;
    }

    const cleanFeatures = await this.cleanDoubleAssets(features);

    if (cleanFeatures.length > 1) {
      void this.handleClusterHover(cleanFeatures as IFeature[], disabledObjects);
    } else {
      const feature = cleanFeatures[0] as mapboxgl.MapboxGeoJSONFeature;
      let featureType = this.objectTypeService.getObjectTypeFromFeature(feature);
      if (disabledObjects.includes(featureType)) {
        featureType = undefined;
      }
      switch (featureType) {
        case ObjectType.intervention:
          this.createObjectPopup(InterventionPopupComponent, JSON.parse(feature.properties.intervention).id);
          break;
        case ObjectType.project:
          this.createObjectPopup(
            ProjectPopupComponent,
            JSON.parse(feature.properties.project).id,
            JSON.parse(feature.properties.project).projectTypeId
          );
          break;
        case ObjectType.rtuProject:
          this.createObjectPopup(RtuProjectPopupComponent, JSON.parse(feature.properties.rtuProject).id);
          break;
        case ObjectType.address:
          this.createObjectPopup(AddressPopupComponent, feature.properties.id);
          break;
        case ObjectType.asset:
          const assetTypeId = await this.assetService.getAssetTypeAndIdFromAssetFeature(feature);
          this.createObjectPopup(AssetPopupComponent, assetTypeId.assetType, assetTypeId.assetId);
          break;
        case ObjectType.countBorough:
          this.createObjectPopup(BoroughCountPopupComponent, feature);
          break;
        default:
          break;
      }
    }
  }

  /**
   * Remove the assets with layer.id = XXX that already had  a highlight feature with layer.id= 'highlight-XXX'
   * in the feature array
   * The purpose of this is to avoid the duplicates on the popup when a feature is highlighted
   *
   * @private
   * @param {mapboxgl.MapboxGeoJSONFeature[]} features
   * @returns {Promise<mapboxgl.MapboxGeoJSONFeature[]>}
   * @memberof MapPopupService
   */
  private cleanDoubleAssets(features: mapboxgl.MapboxGeoJSONFeature[]): Promise<mapboxgl.MapboxGeoJSONFeature[]> {
    const highlightFeatures = features.filter(
      (feat: mapboxgl.MapboxGeoJSONFeature) => feat.layer.id.indexOf(LayerPrefix.HIGHLIGHT) >= 0
    );

    const cleanFeatures: mapboxgl.MapboxGeoJSONFeature[] = features.reduce(
      (accu: mapboxgl.MapboxGeoJSONFeature[], currVal: mapboxgl.MapboxGeoJSONFeature) => {
        const highlightFeature = highlightFeatures.find(val => val.layer.id.indexOf(currVal.layer.id) > 0); // current Feature XXXX had a highlight-XXXX feature

        // Keep  curVal feature with layer.id = XXXX if it doesnt had a highlight-XXXX features in highlightFeatures
        if (!highlightFeature) {
          accu.push(currVal);
        }
        return accu;
      },
      []
    );

    return Promise.resolve(cleanFeatures);
  }

  private async handleClusterHover(features: any[], disabledObjects: ObjectType[]): Promise<void> {
    const objects: ObjectTypeModel[] = [];
    for (const f of features) {
      let objectType = this.objectTypeService.getObjectTypeFromFeature(f);
      if (disabledObjects.includes(objectType)) {
        objectType = undefined;
      }
      switch (objectType) {
        case ObjectType.intervention:
          const intervention = JSON.parse(f.properties.intervention) as IEnrichedIntervention;
          if (intervention.id) {
            objects.push(intervention);
          }
          break;
        case ObjectType.project:
          objects.push(JSON.parse(f.properties.project));
          break;
        case ObjectType.rtuProject:
          objects.push({ partnerId: '', ...JSON.parse(f.properties.rtuProject) }); // The partnerId property is used by getObjectTypeFromModel()
          break;
        case ObjectType.address:
          objects.push(f);
          break;
        case ObjectType.asset:
          const assetTypeIdPair = await this.assetService.getAssetTypeAndIdFromAssetFeature(f);
          const asset: IAsset = { id: assetTypeIdPair.assetId, typeId: assetTypeIdPair.assetType } as any;
          objects.push(asset);
          break;
        default:
          break;
      }
    }

    this.createObjectPopup(ClusterPopupComponent, objects);
  }

  private createObjectPopup<C extends BasePopupComponent>(component: Type<C>, ...args: any): void {
    const result = this.dynamicComponentService.injectComponent(component, this.injector);
    void result.componentRef.instance.init(...args);
    void this.createPopup(result);
  }

  private async createPopup(dynamicComponentResult: IDynamicComponentResult<BasePopupComponent>): Promise<void> {
    const component = dynamicComponentResult.componentRef.instance;
    await component.afterViewInit$.pipe(take(1)).toPromise();

    this.closePopup();

    const options: IMapboxglPopupOptionsExtended = {
      anchor: this.getPopupAnchorPositionFacingCenter(),
      closeButton: false,
      closeOnClick: true,
      maxWidth: null,
      offset: 8
    };

    this.popup = new Popup(options)
      .setLngLat(this.lastMouseCoordinatesLngLat)
      .setDOMContent(dynamicComponentResult.html)
      .addTo(this.mapComponent.map);

    this.popupHoveredSubject.next(false);
    dynamicComponentResult.html.onmouseenter = () => this.popupHoveredSubject.next(true);
    dynamicComponentResult.html.onmouseleave = () => this.popupHoveredSubject.next(false);
    this.popup.on('close', () => {
      dynamicComponentResult.componentRef.destroy();
      this.popupHoveredSubject.next(false);
    });

    component.initialized$.pipe(take(1)).subscribe(() => {
      this.isRefreshingMapForPopup = true;
      this.mapService.refreshMap();
      setTimeout(() => {
        this.isRefreshingMapForPopup = false;
      }, POPUP_MAP_REFRESH_THRESHOLD);
    });
  }

  public closePopup(): void {
    if (this.popup) {
      this.popup.remove();
    }
  }

  private getPopupAnchorPositionFacingCenter(): Anchor {
    const h = this.mapComponent.map.getCanvas().height;
    const w = this.mapComponent.map.getCanvas().width;

    const distancesToCorners: { anchor: Anchor; distance: number }[] = [
      { anchor: 'top-left', distance: new Point(0, 0).dist(this.lastMouseCoordinatesInCanvas) },
      { anchor: 'left', distance: new Point(0, h / 2).dist(this.lastMouseCoordinatesInCanvas) },
      { anchor: 'bottom-left', distance: new Point(0, h).dist(this.lastMouseCoordinatesInCanvas) },
      { anchor: 'bottom', distance: new Point(w / 2, h).dist(this.lastMouseCoordinatesInCanvas) },
      { anchor: 'bottom-right', distance: new Point(w, h).dist(this.lastMouseCoordinatesInCanvas) },
      { anchor: 'right', distance: new Point(w, h / 2).dist(this.lastMouseCoordinatesInCanvas) },
      { anchor: 'top-right', distance: new Point(w, 0).dist(this.lastMouseCoordinatesInCanvas) },
      { anchor: 'top', distance: new Point(w / 2, 0).dist(this.lastMouseCoordinatesInCanvas) }
    ];

    // Return anchor position with the lowest distance to cursor
    return first(distancesToCorners.sort((a, b) => a.distance - b.distance)).anchor;
  }
}

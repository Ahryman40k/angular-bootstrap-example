import { Injectable } from '@angular/core';
import { get, isEqual } from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import { debounceTime, map, take } from 'rxjs/operators';
import { IGlobalLayer } from 'src/app/map/panel/asset-layer/global-layer';
import {
  ILayerGroup,
  ILayerManagerConfig,
  ILayerSubGroup,
  ILayerType,
  mapLayerManagerConfig
} from 'src/app/map/panel/asset-layer/map-layer-manager-config';

import { LayerManagerSubGroupIdsType } from '../models/assets/asset-layer-group';
import { MapService } from './map.service';
import { TaxonomyAssetService } from './taxonomy-asset.service';
import { UserLocalStorageService } from './user-local-storage.service';

export const GLOBAL_LAYER_DEBOUNCE = 200;
const globalLayerStorageKey = 'global-layer-service-key';

@Injectable({
  providedIn: 'root'
})
export class GlobalLayerService {
  private readonly layerSubject = new BehaviorSubject<IGlobalLayer>({});
  public readonly layer$: Observable<IGlobalLayer>;

  public get layer(): IGlobalLayer {
    return this.layerSubject.value;
  }

  public set layer(globalLayer: IGlobalLayer) {
    if (isEqual(this.layer, globalLayer)) {
      return;
    }
    this.setLayerVisibility(this.layer, false);

    if (!globalLayer) {
      return;
    }
    this.setLayerVisibility(globalLayer, true);
    this.layerSubject.next(globalLayer);
  }

  private readonly _layerManagerConfig: ILayerManagerConfig;

  constructor(
    private readonly mapService: MapService,
    private readonly userLocalStorageService: UserLocalStorageService,
    private readonly taxoAssetService: TaxonomyAssetService
  ) {
    this._layerManagerConfig = mapLayerManagerConfig;
    this.layerSubject.pipe(debounceTime(GLOBAL_LAYER_DEBOUNCE)).subscribe(layer => void this.saveLayer(layer));
    this.layer$ = this.layerSubject.asObservable();
    // TODO: remove comment after being in production the 08/03/2021
    // this method gets the user already saved layers from local storage and init them
    // void this.initLayer();
  }

  private async initLayer(): Promise<void> {
    const layer = await this.userLocalStorageService.get<IGlobalLayer>(globalLayerStorageKey);
    if (layer) {
      this.layerSubject.next(layer);
    }
  }

  public clearLayers(): void {
    this.setLayerVisibility(this.layer, false);
    this.layerSubject.next({});
  }

  public isLayerActiveObs(...layerKeys: (keyof IGlobalLayer)[]): Observable<boolean> {
    return this.layer$.pipe(map(() => this.isLayerActive(this.layer, ...layerKeys)));
  }

  public isLayerActive(layer: IGlobalLayer, ...layerKeys: (keyof IGlobalLayer)[]): boolean {
    return layerKeys.some(key => {
      const value = get(layer, key);
      return value !== undefined && value !== null && (!(value instanceof Array) || value.length !== 0);
    });
  }

  /**
   * Get the group in the layer manager config by its groupId
   *
   * @param {string} groupId
   * @returns {ILayerGroup}
   * @memberof LayerManagerService
   */
  public getLayerGroupById(groupId: string): ILayerGroup {
    // Flattening all the groups to get targeted group
    const targetGroups = this._layerManagerConfig.layersType
      .reduce((accu: ILayerGroup[], currVal: ILayerType) => {
        return accu.concat(currVal.groups);
      }, [])
      .filter((currVal: ILayerGroup) => currVal.groupId === groupId);
    return targetGroups ? targetGroups[0] : null;
  }

  /**
   * Get the subgroup in the layer manager config by its groupId
   *
   * @param {LayerManagerSubGroupIdsType} subGroupId
   * @returns {ILayerSubGroup}
   * @memberof LayerManagerService
   */
  public getLayerSubGroupById(subGroupId: LayerManagerSubGroupIdsType): ILayerSubGroup {
    const allSubGroups = this.getAllLayerSubGroups();
    const targetSubGroups = allSubGroups.filter(currVal => currVal.subGroupId === subGroupId);
    return targetSubGroups ? targetSubGroups[0] : null;
  }

  /**
   * Get all subgroups in the layer manager config
   *
   * @returns {ILayerSubGroup[]}
   * @memberof LayerManagerService
   */
  public getAllLayerSubGroups(): ILayerSubGroup[] {
    let allSubGroups: ILayerSubGroup[] = [];

    // Flattening all the subgroups
    this._layerManagerConfig.layersType.forEach(layerType => {
      allSubGroups = layerType.groups.reduce((accu: ILayerSubGroup[], currVal: ILayerGroup) => {
        return accu.concat(currVal.subGroups);
      }, allSubGroups);
    });

    return allSubGroups;
  }

  /**
   *  for layers are consultationOnly
   *
   * @returns {ILayerSubGroup[]}
   * @memberof LayerManagerService
   */
  public async setLayersVisibilityNotConsultationOnlyFromSubGroups(subGroups: ILayerSubGroup[]): Promise<void> {
    const layersConsultationOnly = await this.getLayersConsultationOnly();

    subGroups.forEach((subGroup: ILayerSubGroup) => {
      // Remove layers with proerties.consultationOnly === true from layers to set to visible
      const layersVisible = subGroup.layers
        .filter(layer => !layersConsultationOnly.includes(layer.layerId))
        .map(layer => layer.layerId);
      this.setLayersVisibility(subGroup.subGroupId, layersVisible);
    });
  }

  public async getLayersConsultationOnly(): Promise<string[]> {
    let layersConsultationOnly: string[] = [];

    const assets = await this.taxoAssetService
      .getAllTaxonomyAssets()
      .pipe(take(1))
      .toPromise();

    layersConsultationOnly = assets
      .filter(asset => {
        return asset.properties.consultationOnly;
      })
      .map(asset => asset.code);

    return layersConsultationOnly;
  }

  public setLayersVisibility(subGroupId: LayerManagerSubGroupIdsType, logicLayersIds: string[] = []): void {
    const subGroup = this.getLayerSubGroupById(subGroupId);
    subGroup.layers.forEach(async layer => {
      const isLayerVisible = logicLayersIds.includes(layer.layerId);
      layer.isVisible = isLayerVisible;
      if (layer.layerId) {
        await this.mapService.setLayerVisibility([layer.layerId], isLayerVisible);
      }
    });
  }

  public setLayersVisibilityFromSubGroups(subGroups: ILayerSubGroup[]): void {
    subGroups.forEach((subGroup: ILayerSubGroup) => {
      const layers = subGroup.layers.map(layer => layer.layerId);
      this.setLayersVisibility(subGroup.subGroupId, layers);
    });
  }

  public isLayerVisible(layerId: string): boolean {
    let isLayerVisible = false;
    for (const layer in this.layer) {
      if (Object.prototype.hasOwnProperty.call(this.layer, layer)) {
        isLayerVisible = this.layer[layer]?.includes(layerId);
        if (isLayerVisible) {
          return true;
        }
      }
    }
    return isLayerVisible;
  }

  public patch(layerPatch: IGlobalLayer): void {
    const layer = Object.assign({}, this.layerSubject.value, layerPatch);
    this.layerSubject.next(layer);
  }

  private setLayerVisibility(layer: IGlobalLayer, isVisible: boolean): void {
    const layerValues = Object.values(layer);
    const layers: string[] = [];
    layerValues.forEach(layerGroup => layers.push(...layerGroup));
    layers.forEach(l => this.mapService.setLayerVisibility([l], isVisible));
  }

  private saveLayer(layer: IGlobalLayer): Promise<void> {
    return this.userLocalStorageService.set(globalLayerStorageKey, layer);
  }
}

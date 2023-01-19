import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  IFeature,
  IRtuProject,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { MapComponent as LibMapComponent } from '@villemontreal/maps-angular-lib';
import { GeoJSONSource } from 'mapbox-gl';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';

import { LayerPrefix } from 'src/app/map/config/layers/layer-enums';
import { MapLayersSources } from '../../../map/config/layers/map-enums';
import { IHoverLayerConfig } from '../../../map/hover/hover-layer-configs';
import { IAddressFull } from '../../models/location/address-full';
import { ObjectType } from '../../models/object-type/object-type';
import { Visibility } from '../../models/visibility';
import { UserService } from '../../user/user.service';
import { MapAssetLayerService } from '../map-asset-layer.service';
import { EXTERNAL_ASSETS_LAYER, MapService } from '../map.service';
import { SearchObjectsService } from '../search-objects.service';
import { highlightRoadSectionConfig } from './highlight-layer-config';

export type ObjectToHighlight = IAsset | IEnrichedIntervention | IEnrichedProject | IRtuProject;

@Injectable({ providedIn: 'root' })
export class MapHighlightService {
  private readonly highlightedProjectsSubject = new BehaviorSubject<IEnrichedProject[]>([]);
  public highlightedProjects$ = this.highlightedProjectsSubject.asObservable();
  public get highlightedProjects(): IEnrichedProject[] {
    return this.highlightedProjectsSubject.value;
  }

  private readonly highlightedRtuProjectsSubject = new BehaviorSubject<IRtuProject[]>([]);
  public highlightedRtuProjects$ = this.highlightedRtuProjectsSubject.asObservable();
  public get highlightedRtuProjects(): IRtuProject[] {
    return this.highlightedRtuProjectsSubject.value;
  }

  private readonly highlightedInterventionsSubject = new BehaviorSubject<IEnrichedIntervention[]>([]);
  public highlightedInterventions$ = this.highlightedInterventionsSubject.asObservable();
  public get highlightedInterventions(): IEnrichedIntervention[] {
    return this.highlightedInterventionsSubject.value;
  }

  private readonly highlightedAssetsSubject = new BehaviorSubject<IAsset[]>([]);
  public highlightedAssets$ = this.highlightedAssetsSubject.asObservable();
  public get highlightedAssets(): IAsset[] {
    return this.highlightedAssetsSubject.value;
  }

  private readonly highlightedAddressesSubject = new BehaviorSubject<IAddressFull[]>([]);
  public highlightedAddresses$ = this.highlightedAddressesSubject.asObservable();
  public get highlightedAddresses(): IAddressFull[] {
    return this.highlightedAddressesSubject.value;
  }

  public get isAnythingHighlighted(): boolean {
    return (
      !!this.highlightedAddresses.length ||
      !!this.highlightedInterventions.length ||
      !!this.highlightedProjects.length ||
      !!this.highlightedRtuProjects.length
    );
  }

  constructor(
    private readonly searchObjectsService: SearchObjectsService,
    private readonly mapService: MapService,
    private readonly mapAssetLayerService: MapAssetLayerService,
    private readonly userService: UserService
  ) {}

  public highlight(object: ObjectToHighlight): void {
    switch (this.searchObjectsService.getResultType(object)) {
      case ObjectType.project:
        this.addObjectToSubject(this.highlightedProjectsSubject, object);
        break;
      case ObjectType.rtuProject:
        this.addObjectToSubject(this.highlightedRtuProjectsSubject, object);
        break;
      case ObjectType.intervention:
        this.highlightIntervention(object as IEnrichedIntervention);
        break;
      case ObjectType.address:
        this.addObjectToSubject(this.highlightedAddressesSubject, object);
        break;
      case ObjectType.asset:
        this.highlightAsset(object as IAsset);
        break;
      default:
        break;
    }
  }

  public unhighlight(object: ObjectToHighlight): void {
    switch (this.searchObjectsService.getResultType(object)) {
      case ObjectType.project:
        this.removeObjectFromSubject(this.highlightedProjectsSubject, object);
        break;
      case ObjectType.rtuProject:
        this.removeObjectFromSubject(this.highlightedRtuProjectsSubject, object);
        break;
      case ObjectType.intervention:
        this.unhighlightIntervention(object as IEnrichedIntervention);
        break;
      case ObjectType.address:
        this.removeObjectFromSubject(this.highlightedAddressesSubject, object);
        break;
      case ObjectType.asset:
        this.unhighlightAsset(object as IAsset);
        break;
      default:
        break;
    }
  }

  public highlightRoadSections(e: any[]): void {
    if (e) {
      this.highlightRoadSectionConfig(e, highlightRoadSectionConfig);
    }
  }

  private highlightRoadSectionConfig(roadSections: any[], config: IHoverLayerConfig): void {
    this.setRoadSectionHighlightSource(roadSections);
    roadSections.forEach(roadSection => {
      config.hoveredId = roadSection.id;
      this.setFeatureStateHighlight(true, config);
    });
  }

  private setRoadSectionHighlightSource(features: IFeature[]): void {
    const source = this.mapService.map?.map.getSource(MapLayersSources.ROAD_SECTION_HIGHLIGHT) as GeoJSONSource;
    if (!source) {
      return;
    }
    source.setData(turf.featureCollection(features || []) as any);
  }

  private setFeatureStateHighlight(highlighted: boolean, config: IHoverLayerConfig): void {
    this.mapService.map?.map.setFeatureState(
      { source: config.source, sourceLayer: config.sourceLayer, id: config.hoveredId },
      { highlighted }
    );
  }

  public async clearHighlight(): Promise<void> {
    this.highlightedInterventionsSubject.next([]);
    this.highlightedProjectsSubject.next([]);
    this.highlightedAddressesSubject.next([]);
    this.highlightedRtuProjectsSubject.next([]);
    await this.clearHighlightAsset();
  }

  public clearRoadSectionHighlights(e: any[]): void {
    if (e?.length) {
      e.forEach(element => {
        this.clearRoadSectionHighlight(element, highlightRoadSectionConfig);
      });
    }
  }

  private clearRoadSectionHighlight(e: any, config: IHoverLayerConfig): void {
    config.hoveredId = e.id;
    this.setFeatureStateHighlight(false, config);
  }

  public async onAssetListHover(assets: IAsset[]): Promise<void> {
    await this.clearHighlight();
    for (const asset of assets) {
      this.highlight(asset);
    }
  }

  public setRoadSectionVisibility(visibility: Visibility): void {
    this.mapService.map?.map.setLayoutProperty('highlight-roads-section-selection', 'visibility', visibility);
  }

  private highlightIntervention(intervention: IEnrichedIntervention): void {
    this.addObjectToSubject(this.highlightedInterventionsSubject, intervention);
    intervention.assets.forEach(asset => {
      this.highlightAsset(asset);
    });
  }

  private unhighlightIntervention(intervention: IEnrichedIntervention): void {
    this.removeObjectFromSubject(this.highlightedInterventionsSubject, intervention);
    intervention.assets.forEach(asset => {
      this.unhighlightAsset(asset);
    });
  }

  private highlightAsset(asset: IAsset): void {
    if (!this.canAddObjectToSubject(this.highlightedAssetsSubject, asset)) {
      return;
    }
    this.addObjectToSubject(this.highlightedAssetsSubject, asset);
    void this.updateHighlightedAssets(this.highlightedAssetsSubject.value);
  }

  private unhighlightAsset(asset: IAsset): void {
    if (!this.canRemoveObjectFromSubject(this.highlightedAssetsSubject, asset)) {
      return;
    }
    this.removeObjectFromSubject(this.highlightedAssetsSubject, asset);
    void this.updateHighlightedAssets(this.highlightedAssetsSubject.value);
  }

  public async clearHighlightAsset(): Promise<void> {
    if (!(await this.userService.hasPermission(Permission.ASSET_READ))) {
      return;
    }

    const enabledLogicLayerIds = await this.mapAssetLayerService
      .getEnabledLogicLayerIds()
      .pipe(take(1))
      .toPromise();
    for (const logicLayerId of enabledLogicLayerIds) {
      this.mapService.map?.highlight(logicLayerId, ['0']);
    }

    // Handle assets layers that do exists in geomatic api (NEXO)
    for (const externalLayer of this.mapService.getExternalLayers(LayerPrefix.HIGHLIGHT)) {
      this.mapService.setMapLayerStyleWithPrefixForIds(externalLayer.id, LayerPrefix.HIGHLIGHT, ['0']);
    }
    this.highlightedAssetsSubject.next([]);
  }

  private canAddObjectToSubject(subject: BehaviorSubject<ObjectToHighlight[]>, object: ObjectToHighlight): boolean {
    const index = subject.value.indexOf(object);
    return index === -1;
  }

  private addObjectToSubject(subject: BehaviorSubject<ObjectToHighlight[]>, object: ObjectToHighlight): void {
    const subjectValue = subject.value;
    const index = subjectValue.indexOf(object);
    if (index > -1) {
      return;
    }
    subjectValue.push(object);
    subject.next(subjectValue);
  }

  private canRemoveObjectFromSubject(
    subject: BehaviorSubject<ObjectToHighlight[]>,
    object: ObjectToHighlight
  ): boolean {
    const index = subject.value.indexOf(object);
    return index > -1;
  }

  private removeObjectFromSubject(subject: BehaviorSubject<ObjectToHighlight[]>, object: ObjectToHighlight): void {
    const subjectValue = subject.value;
    const index = subjectValue.indexOf(object);
    if (index < 0) {
      return;
    }
    subjectValue.splice(index, 1);
    subject.next(subjectValue);
  }

  private async updateHighlightedAssets(assets: IAsset[]): Promise<void> {
    if (!(await this.userService.hasPermission(Permission.ASSET_READ))) {
      return;
    }

    const enabledLogicLayerIds = await this.mapAssetLayerService
      .getEnabledLogicLayerIds()
      .pipe(take(1))
      .toPromise();

    for (const logicLayerId of enabledLogicLayerIds) {
      let assetTypes: AssetType[];
      if (logicLayerId === AssetType.roadway) {
        assetTypes = [AssetType.roadway];
      } else {
        assetTypes = await this.mapAssetLayerService
          .getAssetTypesFromLogicLayerId(logicLayerId)
          .pipe(take(1))
          .toPromise();
      }
      const ids = assets.filter(a => a.id && assetTypes.includes(a.typeId as AssetType)).map(a => String(a.id));
      this.mapService.map?.highlight(logicLayerId, ids.length ? ids : ['0']);
    }
  }

  /**
   * This is an override of the existing setLayerFilter method of the lib.
   * We need to override it because it doesn't support different identifiers.
   * It is a copy and paste of the method in the library, but we remove the check for "id".
   */
  public configureMapHighlightFunction(map: LibMapComponent): void {
    // tslint:disable-next-line: no-string-literal
    map['setIdsOnFilterById'] = function(this: LibMapComponent, layerId: string, featuresIds: string[]): void {
      let fixedFeatureId = [''];
      if (featuresIds.length > 0) {
        fixedFeatureId = featuresIds;
      }
      const filter: any[] = this.map.getFilter(layerId);
      if (filter) {
        for (const item of filter) {
          // Checks whether the filter is an highlight filter. See method filterById in src\app\map\config\layers\utils.ts.
          if (Array.isArray(item) && item[0] === 'match' && item[1][0] === 'to-string' && item[1][1][0] === 'get') {
            item[2] = fixedFeatureId;
            break;
          }
        }
      }
      this.map.setFilter(layerId, filter);
    };
  }
}

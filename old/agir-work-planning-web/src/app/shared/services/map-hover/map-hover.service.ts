import { Injectable } from '@angular/core';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  IRtuProject,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { MapComponent } from '@villemontreal/maps-angular-lib';
import { isEqual } from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { LayerPrefix } from 'src/app/map/config/layers/layer-enums';
import { IAddressFull } from '../../models/location/address-full';
import { ObjectType } from '../../models/object-type/object-type';
import { UserService } from '../../user/user.service';
import { MapAssetLayerService } from '../map-asset-layer.service';
import { EXTERNAL_ASSETS_LAYER, MapService } from '../map.service';
import { ExternalReferenceIdType, NexoService } from '../nexo.service';
import { SearchObjectsService } from '../search-objects.service';

export type ObjectToHover = IAsset | IEnrichedIntervention | IEnrichedProject | IRtuProject | IAddressFull;

@Injectable({ providedIn: 'root' })
export class MapHoverService {
  private mapComponent: MapComponent;

  private readonly hoveredProjectsSubject = new BehaviorSubject<IEnrichedProject[]>([]);
  public hoveredProjects$ = this.hoveredProjectsSubject.asObservable();
  public get hoveredProjects(): IEnrichedProject[] {
    return this.hoveredProjectsSubject.value;
  }

  private readonly hoveredRtuProjectsSubject = new BehaviorSubject<IRtuProject[]>([]);
  public hoveredRtuProjects$ = this.hoveredRtuProjectsSubject.asObservable();
  public get hoveredRtuProjects(): IRtuProject[] {
    return this.hoveredRtuProjectsSubject.value;
  }

  private readonly hoveredInterventionsSubject = new BehaviorSubject<IEnrichedIntervention[]>([]);
  public hoveredInterventions$ = this.hoveredInterventionsSubject.asObservable();
  public get hoveredInterventions(): IEnrichedIntervention[] {
    return this.hoveredInterventionsSubject.value;
  }

  private readonly hoveredAssetsSubject = new BehaviorSubject<IAsset[]>([]);
  public hoveredAssets$ = this.hoveredAssetsSubject.asObservable();
  public get hoveredAssets(): IAsset[] {
    return this.hoveredAssetsSubject.value;
  }

  private readonly hoveredAddressesSubject = new BehaviorSubject<IAddressFull[]>([]);
  public hoveredAddresses$ = this.hoveredAddressesSubject.asObservable();
  public get hoveredAddresses(): IAddressFull[] {
    return this.hoveredAddressesSubject.value;
  }

  private readonly hoveredAssetFeaturesSubject = new BehaviorSubject<mapboxgl.MapboxGeoJSONFeature[]>([]);
  public hoveredAssetFeatures$ = this.hoveredAssetFeaturesSubject.asObservable();

  public get isAnythingHovered(): boolean {
    return (
      !!this.hoveredAddresses.length ||
      !!this.hoveredInterventions.length ||
      !!this.hoveredProjects.length ||
      !!this.hoveredRtuProjects.length
    );
  }

  private readonly hoveredObjectsDict = {
    [ObjectType.project]: this.hoveredProjectsSubject,
    [ObjectType.rtuProject]: this.hoveredRtuProjectsSubject,
    [ObjectType.intervention]: this.hoveredInterventionsSubject,
    [ObjectType.address]: this.hoveredAddressesSubject,
    [ObjectType.asset]: this.hoveredAssetsSubject
  };

  constructor(
    private readonly searchObjectsService: SearchObjectsService,
    private readonly mapService: MapService,
    private readonly mapAssetLayerService: MapAssetLayerService,
    private readonly userService: UserService
  ) {}

  public async init(mapComponent: MapComponent): Promise<void> {
    this.mapComponent = mapComponent;

    let layerIds = [];
    if (await this.userService.hasPermission(Permission.ASSET_READ)) {
      layerIds = await this.mapAssetLayerService
        .getEnabledLayerIds()
        .pipe(take(1))
        .toPromise();
    }

    this.initHoveredAssetFeaturesSubject(layerIds);

    this.initPointer();
  }

  public initHoveredAssetFeaturesSubject(hoverLayers: string[]): void {
    this.mapComponent.map.on('mousemove', e => {
      const features = this.mapComponent.map.queryRenderedFeatures(e.point, { layers: hoverLayers });
      if (!isEqual(this.hoveredAssetFeaturesSubject.value, features)) {
        this.hoveredAssetFeaturesSubject.next(features);
      }
    });
  }

  private initPointer(): void {
    this.hoveredAssetFeaturesSubject.subscribe(f => {
      this.mapService.setPointer(f.length > 0);
    });
  }

  public hover(object: ObjectToHover, hover: boolean): void {
    const type = this.searchObjectsService.getResultType(object);
    const subject = this.hoveredObjectsDict[type];
    if (subject) {
      if (hover) {
        this.addObjectToSubject(subject, object);
      } else {
        this.removeObjectFromSubject(subject, object);
      }

      if (type === ObjectType.asset) {
        void this.updateHoveredAssets(this.hoveredAssetsSubject.value);
      }
    }
  }

  public async clearHover(): Promise<void> {
    Object.values(this.hoveredObjectsDict).forEach(item => item.next([]));
    await this.clearHoverAsset();
  }

  public async clearHoverAsset(): Promise<void> {
    if (!(await this.userService.hasPermission(Permission.ASSET_READ))) {
      return;
    }

    await this.updateHoveredAssets([]);
    this.hoveredAssetsSubject.next([]);
  }

  private addObjectToSubject(subject: BehaviorSubject<ObjectToHover[]>, object: ObjectToHover): void {
    const subjectValue = subject.value;
    const index = subjectValue.indexOf(object);
    if (index > -1) {
      return;
    }
    subjectValue.push(object);
    subject.next(subjectValue);
  }

  private removeObjectFromSubject(subject: BehaviorSubject<ObjectToHover[]>, object: ObjectToHover): void {
    const subjectValue = subject.value;
    const index = subjectValue.indexOf(object);
    if (index < 0) {
      return;
    }
    subjectValue.splice(index, 1);
    subject.next(subjectValue);
  }

  private async updateHoveredAssets(assets: IAsset[]): Promise<void> {
    if (!(await this.userService.hasPermission(Permission.ASSET_READ))) {
      return;
    }

    const mapAssets = assets.filter(asset => !!asset.id);

    // hover registered map assets
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

      const ids = mapAssets.filter(a => a.id && assetTypes.includes(a.typeId as AssetType)).map(a => String(a.id));

      this.mapService.map?.hover(logicLayerId, ids.length ? ids : ['0']);
    }

    // Handle assets that do exists in geomatic api (NEXO)
    const referenceTypes = [ExternalReferenceIdType.nexoAssetId, ExternalReferenceIdType.nexoReferenceNumber];
    const externalAssets = assets.filter(asset => {
      if (NexoService.getExternalReferenceIdByTypes(asset, referenceTypes)) {
        return asset;
      }
    });
    const externalAssetsLayers = this.mapService.getExternalLayers(LayerPrefix.HOVER);
    for (const externalLayer of externalAssetsLayers) {
      const featuresIds = this.mapAssetLayerService.getExternalAssetsIdsByLayerType(
        externalAssets,
        referenceTypes,
        externalLayer
      );
      this.mapService.setMapLayerStyleWithPrefixForIds(externalLayer.id, LayerPrefix.HOVER, featuresIds);
    }
  }
}

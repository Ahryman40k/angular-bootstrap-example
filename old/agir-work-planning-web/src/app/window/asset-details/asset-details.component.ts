import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  ITaxonomyAssetDataKey,
  ITaxonomyAssetType,
  ITaxonomyList,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { take, takeUntil } from 'rxjs/operators';
import { LayerPrefix } from 'src/app/map/config/layers/layer-enums';
import { mapProjectAreaLayerIds } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-layer-ids';
import { MapComponent } from 'src/app/map/map.component';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { BrowserWindowService } from 'src/app/shared/services/browser-window.service';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapAssetLayerService } from 'src/app/shared/services/map-asset-layer.service';
import { MapSourceId } from 'src/app/shared/services/map-source.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { TaxonomyAssetService } from 'src/app/shared/services/taxonomy-asset.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { Utils } from 'src/app/shared/utils/utils';

import { BaseDetailsComponent } from '../base-details-component';

@Component({
  selector: 'app-asset-details',
  templateUrl: './asset-details.component.html',
  styleUrls: ['./asset-details.component.scss'],
  providers: [WindowService]
})
export class AssetDetailsComponent extends BaseDetailsComponent implements OnInit {
  public assetDataKeys: ITaxonomyList;
  public lastIntervention: IEnrichedIntervention = null;
  public mainProperties: { code: string; value: string }[] = [];
  public properties: { code: string; value: string }[] = [];
  public isMapInitialized = false;

  public get mapShown(): boolean {
    return this.asset && this.isMapInitialized && !!this.asset?.geometry;
  }

  public get asset(): IAsset {
    return this.windowService.currentAsset;
  }

  public showOptionsButton = false;

  @ViewChild('map') public map: MapComponent;

  constructor(
    activatedRoute: ActivatedRoute,
    windowService: WindowService,
    private readonly browserWindowService: BrowserWindowService,
    private readonly mapService: MapService,
    private readonly taxoAssetService: TaxonomyAssetService,
    private readonly taxonomiesService: TaxonomiesService,
    public interventionService: InterventionService,
    private readonly projectService: ProjectService,
    private readonly mapAssetLayerService: MapAssetLayerService,
    private readonly globalLayerService: GlobalLayerService
  ) {
    super(windowService, activatedRoute);
  }

  public async ngOnInit(): Promise<void> {
    this.activatedRoute.params.subscribe(async params => {
      await this.windowService.setAsset(params.type, params.id);
    });

    await this.initTaxonomies();

    this.windowService.asset$.subscribe(async asset => {
      if (!asset) {
        return;
      }
      const assetType = (await this.taxoAssetService
        .getTaxonomyAsset(asset.typeId as AssetType)
        .pipe(take(1))
        .toPromise()) as ITaxonomyAssetType;
      this.lastIntervention = await this.interventionService.getAssetLastIntervention(
        this.asset.id,
        this.projectService.fromYear - 1
      );
      this.checkAccessOptionsButton(assetType);
      this.extractPropertiesList(this.asset, assetType, this.assetDataKeys as ITaxonomyAssetDataKey[]);
      this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => this.initAsset(assetType));
    });
  }

  private async initAsset(assetType: ITaxonomyAssetType): Promise<void> {
    const currentAsset = this.windowService.currentAsset;
    await this.setMapSource();
    if (currentAsset?.geometry) {
      this.mapService.fitZoomToGeometry(currentAsset?.geometry);
    }
    this.isMapInitialized = true;
    await this.updateMapAssets(currentAsset);
  }

  private async setMapSource(): Promise<void> {
    const layers = this.globalLayerService.getAllLayerSubGroups();
    await this.globalLayerService.setLayersVisibilityNotConsultationOnlyFromSubGroups(layers);
    this.mapService.patchLayers(mapProjectAreaLayerIds, { minzoom: 0 });
    await this.mapService.setLayerVisibility(['interventions'], false);
    this.map.sourceService.clearSource(MapSourceId.interventionCreationAreas);
    this.map.sourceService.clearSource(MapSourceId.interventionPins);
    this.map.highlightService.highlight(this.windowService.currentAsset);
  }

  private async updateMapAssets(asset: IAsset): Promise<void> {
    this.mapService.hideAllMapAssets();

    const assetGroup = {
      type: asset.typeId,
      ids: [asset.id],
      logicLayer: undefined
    };

    assetGroup.logicLayer = await this.mapAssetLayerService
      .getLogicLayerIdFromAssetType(assetGroup.type as AssetType)
      .pipe(take(1))
      .toPromise();

    await this.mapService.setLayerVisibility([assetGroup.logicLayer], true);
    this.mapService.setMapLayerStyleWithPrefixForIds(assetGroup.logicLayer, LayerPrefix.PROJECT, assetGroup.ids);
  }

  private async initTaxonomies(): Promise<void> {
    this.assetDataKeys = await this.taxonomiesService
      .group(TaxonomyGroup.assetDataKey)
      .pipe(take(1))
      .toPromise();
  }

  private extractPropertiesList(
    asset: IAsset,
    assetType: ITaxonomyAssetType,
    assetDataKeys: ITaxonomyAssetDataKey[]
  ): void {
    this.mainProperties = [];
    this.properties = [];

    if (assetType.properties.dataKeys) {
      assetType.properties.dataKeys
        .sort((a, b) => a.displayOrder - b.displayOrder)
        .forEach(dataKey => {
          let value = null;

          if (asset.properties && asset.properties[dataKey.code]) {
            value = asset.properties[dataKey.code];

            const assetDataKey = assetDataKeys.find(item => item.code === dataKey.code);
            if (assetDataKey?.properties?.unit) {
              value += assetDataKey?.properties?.unit;
            }
          }

          const property = {
            code: dataKey.code,
            value: Utils.formatToDate(value, 'yyyy-MM-dd')
          };

          if (dataKey.isMainAttribute) {
            this.mainProperties.push(property);
          } else {
            this.properties.push(property);
          }
        });
    }
  }

  public close(): void {
    this.browserWindowService.close();
  }

  private checkAccessOptionsButton(assetType: ITaxonomyAssetType): void {
    // if consultationOnly, do not show options button
    if (!assetType) {
      return;
    }
    this.showOptionsButton = !assetType.properties.consultationOnly;
  }
}

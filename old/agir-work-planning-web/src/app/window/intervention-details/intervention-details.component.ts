import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AssetType,
  IAssetLastIntervention,
  IEnrichedIntervention,
  InterventionStatus,
  Permission
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty, sum } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import {
  mapInterventionCreationLayerIds,
  mapInterventionLayerIds
} from 'src/app/map/config/layers/logic-layers/interventions/map-intervention-layer-ids';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { MenuItemKey } from 'src/app/shared/models/menu/menu-item-key';
import { IMoreOptionsMenuItem } from 'src/app/shared/models/more-options-menu/more-options-menu-item';
import { InterventionMenuService } from 'src/app/shared/services/intervention-menu.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapSourceId } from 'src/app/shared/services/map-source.service';
import { MapService } from 'src/app/shared/services/map.service';
import { TaxonomyAssetService } from 'src/app/shared/services/taxonomy-asset.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { UserService } from 'src/app/shared/user/user.service';

import { BaseMapComponent } from 'src/app/shared/components/base/base-map.component';
import { ExternalReferenceIdType, NexoService } from 'src/app/shared/services/nexo.service';
import { AssetListComponent, ISelectedAsset } from '../../shared/components/asset-list/asset-list.component';
import { AssetService } from '../../shared/services/asset.service';
import { ProjectService } from '../../shared/services/project.service';
import { IRestrictionItem, RestrictionType } from '../../shared/user/user-restrictions.service';

@Component({
  selector: 'app-intervention-details',
  templateUrl: './intervention-details.component.html',
  styleUrls: ['./intervention-details.component.scss']
})
export class InterventionDetailsComponent extends BaseMapComponent implements OnInit, OnDestroy {
  public InterventionStatus = InterventionStatus;
  public RestrictionType = RestrictionType;

  public menuItems: IMoreOptionsMenuItem[];
  public isAssetHasProperties = false;
  public interventionAssets: ISelectedAsset[];
  public interventionMeterLength: number;
  public isLoading = false;

  private hoveredAssets: ISelectedAsset[] = [];

  @ViewChild('assetList') public assetList: AssetListComponent;

  public get interventionProgram(): Observable<string> {
    return this.interventionService.getInterventionProgram(this.intervention);
  }

  constructor(
    public activatedRoute: ActivatedRoute,
    public dialogsService: DialogsService,
    public windowService: WindowService,
    protected readonly mapService: MapService,
    private readonly interventionMenuService: InterventionMenuService,
    private readonly interventionService: InterventionService,
    private readonly router: Router,
    private readonly assetService: AssetService,
    private readonly projectService: ProjectService,
    private readonly taxoAssetService: TaxonomyAssetService,
    private readonly userService: UserService
  ) {
    super(windowService, activatedRoute, mapService);
  }

  public ngOnInit(): void {
    combineLatest(
      this.windowService.intervention$.pipe(
        takeUntil(this.destroy$),
        takeUntil(this.interventionService.interventionChanged$)
      ),
      this.mapService.mapLoaded$.pipe(
        takeUntil(this.destroy$),
        takeUntil(this.interventionService.interventionChanged$)
      )
    )
      .pipe(takeUntil(this.destroy$), takeUntil(this.interventionService.interventionChanged$))
      .subscribe(async ([intervention]) => {
        if (!intervention) {
          return;
        }

        if (this.project) {
          this.menuItems = this.interventionMenuService.getMenuItems(intervention, {
            newWindow: true,
            hiddenMenuItems: [MenuItemKey.ROAD_SECTION_ACTIVITY]
          });
        }

        await this.setInterventionAssets();
        this.interventionMeterLength = sum(this.intervention.assets.map(asset => asset.length?.value).filter(x => x));

        await this.setInterventionSource();
        this.mapService.fitZoomToGeometry(intervention.interventionArea.geometry);
        this.mapInitialized = true;
        this.isAssetHasProperties = this.taxoAssetService.hasProperties(intervention?.assets[0]?.typeId);

        this.userService
          .hasPermission(Permission.ASSET_READ)
          .then(async hasPermissions => {
            if (hasPermissions) {
              await this.map.hoverService.init(this.map.map);
              this.updateMapAssets(this.interventionAssets);
              this.initMapAssetsEvents();
            }
          })
          .catch();
      });
    this.projectService.fromYearChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(async () => this.setInterventionAssets());
  }

  private updateMapAssets(assets: ISelectedAsset[]): void {
    const mapAssets = assets.filter(item => !!item.asset.id);
    const nexoAssets = assets.filter(item => {
      if (
        NexoService.getExternalReferenceIdByTypes(item.asset, [
          ExternalReferenceIdType.nexoAssetId,
          ExternalReferenceIdType.nexoReferenceNumber
        ])
      ) {
        return item;
      }
    });

    const assetGroup = {
      type: assets[0].asset.typeId as AssetType,
      ids: []
    };

    this.mapService.resetAssetLayers();
    this.mapService.showAssetGroups([assetGroup]);

    if (mapAssets.length) {
      assetGroup.ids = mapAssets.map(item => item.asset.id);

      this.mapService.moveAssetGroupLayers(
        [...mapInterventionLayerIds, ...mapInterventionCreationLayerIds],
        [assetGroup]
      );
    }

    if (nexoAssets.length) {
      this.mapService.addExternalAssetsLayer(nexoAssets.map(a => a.asset));
    }
  }

  private initMapAssetsEvents(): void {
    this.assetList?.assetHoverEvent.pipe(takeUntil(this.destroy$)).subscribe(async (asset: ISelectedAsset) => {
      await this.map.hoverService.clearHoverAsset();
      if (asset) {
        this.map.hoverService.hover(asset.asset, true);
      }
    });

    this.map.hoverService.hoveredAssetFeatures$.pipe(takeUntil(this.destroy$)).subscribe(async features => {
      await this.map.hoverService.clearHoverAsset();

      this.hoveredAssets.forEach(item => {
        this.assetList.highlightAsset(item.assetId, false);
      });
      this.hoveredAssets = [];

      features.forEach(async feature => {
        const assetTypeId = await this.assetService.getAssetTypeAndIdFromAssetFeature(feature);
        const asset = this.interventionAssets.find(item => item.assetId.toString() === assetTypeId.assetId.toString());
        if (asset) {
          this.hoveredAssets.push(asset);
          this.map.hoverService.hover(asset.asset, true);
          this.assetList.highlightAsset(asset.assetId, true);
        }
      });
    });
  }

  public editIntervention(): void {
    void this.router.navigate(['/window/interventions/edit', this.intervention.id]);
  }

  public get assetType(): AssetType {
    return this.assetService.getAssetTypeFromTypeId(this.intervention?.assets.find(el => el)?.typeId);
  }

  private async setInterventionAssets(): Promise<void> {
    if (!this.intervention.assets?.length) {
      return;
    }

    let assetLastInterventions: IAssetLastIntervention[] = [];

    const assetIds = this.intervention.assets.filter(a => a.id).map(a => a.id);
    if (!isEmpty(assetIds)) {
      assetLastInterventions = await this.assetService.getAssetsLastIntervention({
        assetIds,
        planificationYear: this.projectService.fromYear
      });
    }
    this.interventionAssets = this.assetService.getSelectedAssetsFromIntervention(this.intervention);
    this.interventionAssets.forEach(value => {
      value.lastIntervention = assetLastInterventions.find(a => a.assetId === value.asset.id)?.intervention;
    });
  }

  private async setInterventionSource(): Promise<void> {
    // Removing the pin without modifying the original intervention
    const intervention = cloneDeep(this.windowService.currentIntervention);
    intervention.interventionArea.geometryPin = null;

    await this.map.highlightService.clearHighlight();
    await this.map.hoverService.clearHover();
    const features = this.interventionService.getAreaFeatures([intervention]);
    this.map.sourceService.setSource(MapSourceId.interventionCreationAreas, features);
  }

  public isInterventionHasAssets(intervention: IEnrichedIntervention): boolean {
    if (!intervention.assets?.length) {
      return false;
    }

    return !intervention.assets.find(asset => {
      const externalReferenceId = NexoService.getExternalReferenceIdByTypes(asset, [
        ExternalReferenceIdType.nexoAssetId,
        ExternalReferenceIdType.nexoReferenceNumber
      ]);
      return !asset.id && !externalReferenceId;
    });
  }
}

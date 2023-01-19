import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IAssetList, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { uniqBy } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { MapHoverService } from 'src/app/shared/services/map-hover/map-hover.service';
import { MapRoadSectionHoverService } from 'src/app/shared/services/map-road-selection-hover.service';
import { TaxonomyAssetService } from 'src/app/shared/services/taxonomy-asset.service';

import { AssetListComponent, ISelectedAsset } from '../../../shared/components/asset-list/asset-list.component';
import { BaseComponent } from '../../../shared/components/base/base.component';
import { AssetService } from '../../../shared/services/asset.service';
import { GlobalLayerService } from '../../../shared/services/global-layer.service';
import { MapHighlightService } from '../../../shared/services/map-highlight/map-highlight.service';
import { MapSelectionService } from '../../../shared/services/map-selection.service';
import { MapService } from '../../../shared/services/map.service';
import { ProjectService } from '../../../shared/services/project.service';
import { RoadSectionSelectionService } from '../../../shared/services/road-section-selection.service';
import { RouteService } from '../../../shared/services/route.service';
import { TaxonomiesService } from '../../../shared/services/taxonomies.service';

@Component({
  selector: 'app-asset-selection',
  templateUrl: './asset-selection.component.html'
})
export class AssetSelectionComponent extends BaseComponent implements OnInit, OnDestroy {
  public assetTypes: ITaxonomy[];
  public assetDataKeys: ITaxonomy[];
  public form: FormGroup;
  public selectedAssets: ISelectedAsset[] = [];
  public isAssetHasProperties = false;
  private currentSelectedAssetType: string;
  private selectedRoadSections: any[] = [];
  private hasEnabledLayer = true;

  @ViewChild(AssetListComponent) public assetListComponent: AssetListComponent;

  constructor(
    private readonly taxonomiesService: TaxonomiesService,
    private readonly fb: FormBuilder,
    public readonly mapService: MapService,
    public hoverService: MapHoverService,
    private readonly mapHoverService: MapRoadSectionHoverService,
    private readonly routeService: RouteService,
    private readonly assetService: AssetService,
    private readonly highlightService: MapHighlightService,
    private readonly projectService: ProjectService,
    private readonly globalLayerService: GlobalLayerService,
    private readonly router: Router,
    private readonly mapSelectionService: MapSelectionService,
    private readonly roadSectionSelectionService: RoadSectionSelectionService,
    private readonly taxoAssetService: TaxonomyAssetService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.mapHoverService.init(this.mapService.map);
      setTimeout(async () => {
        await this.initTaxonomies().then(() => this.init());
      });
    });
  }

  public initSelectionTool(): void {
    this.clearRoadSections();
    this.mapHoverService.initRoadSectionSelectionHover();
    this.highlightService.setRoadSectionVisibility('visible');
    this.mapService.activateRoadSectionSelection();
  }

  public async onAssetListHover(selectedAsset: ISelectedAsset): Promise<void> {
    await this.highlightService.clearHighlight();
    let assets = this.selectedAssets.map(el => el.asset);
    if (selectedAsset) {
      assets = assets.filter(el => el.id === selectedAsset.asset.id);
    }
    this.highlightAssets(assets);
  }

  public async closePanel(): Promise<void> {
    await this.clearSelection();
    await this.routeService.clearOutlet('leftPanel');
  }

  public async reset(): Promise<void> {
    this.clearRoadSections();
    await this.highlightService.clearHighlightAsset();
    this.selectedAssets = [];
    this.selectedRoadSections = [];
  }

  public async submit(selectedAssets: ISelectedAsset[]): Promise<void> {
    this.assetService.setSelectedAssets(selectedAssets);
    await this.router.navigate([`/window/interventions/create/multiple-asset`]);
  }

  private init(): void {
    this.initForm();
    this.initSelectionTool();
    this.initSelectedRoadSectionsSubscription();
  }

  private async initTaxonomies(): Promise<void> {
    this.assetTypes = await this.taxonomiesService
      .group(TaxonomyGroup.assetType)
      .pipe(
        take(1),
        map(assetTypes => assetTypes.filter(at => !at.properties?.consultationOnly)),
        switchMap(x => this.getFilteredAssetTypes(x)),
        takeUntil(this.destroy$)
      )
      .toPromise();

    this.assetDataKeys = await this.taxonomiesService
      .group('assetDataKey')
      .pipe(take(1), takeUntil(this.destroy$))
      .toPromise();
  }

  private getFilteredAssetTypes(assetTypes: ITaxonomy[]): Observable<ITaxonomy[]> {
    return this.taxonomiesService.group(TaxonomyGroup.mapAssetLogicLayer).pipe(
      take(1),
      map(logicLayers =>
        assetTypes.filter(assetType => logicLayers.find(logicLayer => logicLayer.code === assetType.code))
      ),
      takeUntil(this.destroy$)
    );
  }

  private initForm(): void {
    this.form = this.fb.group({
      assetType: [null, Validators.required]
    });
    combineLatest(
      this.form.controls.assetType.valueChanges.pipe(startWith(null)),
      this.projectService.fromYearChanged$.pipe(startWith(null))
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([assetType]) => {
        if (!assetType) {
          return;
        }
        this.isAssetHasProperties = this.taxoAssetService.hasProperties(assetType);
        this.assetListComponent?.resetLists();
        if (this.hasEnabledLayer && this.currentSelectedAssetType) {
          await this.mapService.setLayerVisibility([this.currentSelectedAssetType], false);
        }
        this.hasEnabledLayer = !this.globalLayerService.isLayerVisible(assetType);
        if (this.hasEnabledLayer) {
          this.currentSelectedAssetType = assetType;
          await this.mapService.setLayerVisibility([assetType], true);
        }
        await this.highlightService.clearHighlightAsset();
        this.selectedAssets = [];
        if (this.selectedRoadSections?.length) {
          for (const roadSection of this.selectedRoadSections) {
            await this.handleRoadSectionAssets(roadSection);
          }
        }
      });
  }
  private initSelectedRoadSectionsSubscription(): void {
    this.mapService.selectedRoadSections$.pipe(takeUntil(this.destroy$)).subscribe(async roadSections => {
      if (!roadSections?.length) {
        return;
      }
      this.selectedRoadSections.push(roadSections[roadSections.length - 1]);
      this.highlightService.highlightRoadSections(this.selectedRoadSections);
      await this.handleRoadSectionAssets(roadSections[roadSections.length - 1]);
    });
  }

  private async handleRoadSectionAssets(roadSection: any): Promise<void> {
    this.form.controls.assetType.disable({ emitEvent: false });
    this.mapService.isLoadingRoadSection = true;
    let roadSectionAssets: IAssetList;
    if (roadSection && this.form.controls.assetType?.value) {
      roadSectionAssets = await this.roadSectionSelectionService.getRoadSectionAssets(
        roadSection,
        this.form.controls.assetType?.value
      );
    }

    if (!roadSectionAssets?.length) {
      this.form.controls.assetType.enable({ emitEvent: false });
      this.mapService.isLoadingRoadSection = false;
      return;
    }
    await this.addAssets(roadSectionAssets);
  }

  private async addAssets(assets: IAssetList): Promise<void> {
    const newAssets: IAssetList = assets.filter(
      asset =>
        !this.selectedAssets.find(selectedAsset => selectedAsset.asset.id === asset.id) &&
        this.assetService.isAssetIdValid(asset.id)
    );
    const noDuplicateAssets: IAssetList = uniqBy(newAssets, asset => asset.id);

    const selectedAssets = await this.assetService.getSelectedAssetsFromAssets(noDuplicateAssets, this.assetDataKeys);
    this.selectedAssets.push(...selectedAssets);

    this.highlightAssets(noDuplicateAssets);
    this.form.controls.assetType.enable({ emitEvent: false });
    this.mapService.isLoadingRoadSection = false;
  }

  private highlightAssets(assets: IAssetList): void {
    assets.forEach(asset => {
      this.highlightService.highlight(asset);
    });
  }

  private async clearSelection(): Promise<void> {
    if (this.currentSelectedAssetType && this.hasEnabledLayer) {
      await this.mapService.setLayerVisibility([this.currentSelectedAssetType], false);
    }
    await this.highlightService.clearHighlightAsset();
    this.mapHoverService.disableRoadSectionVisibility();
    this.highlightService.setRoadSectionVisibility('none');
    this.mapService.mapComponent?._map?.currentTool?.cancel();
    this.mapService.mapComponent.map.interactionMode = 'simple-selection';
    this.mapSelectionService.start();
  }

  private clearRoadSections(): void {
    this.highlightService.clearRoadSectionHighlights(this.mapService.selectedRoadSectionsSubject.value);
    this.mapService.clearRoadSectionsSelection();
  }

  public ngOnDestroy(): void {
    setTimeout(async () => {
      await this.clearSelection();
    });
    super.ngOnDestroy();
  }
}

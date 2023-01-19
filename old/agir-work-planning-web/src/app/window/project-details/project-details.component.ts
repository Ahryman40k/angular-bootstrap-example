import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IAsset,
  IEnrichedProgramBook,
  ITaxonomyList,
  Permission,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest, Observable, of } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { mapProjectAreaLayerIds } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-layer-ids';
import { mapProjectAreaLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-logic-layers';
import { mapProjectPinLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-pin-logic-layers';
import {
  plannedProjectLayerIds,
  postponedProjectLayerIds,
  projectLayerIds,
  replannedProjectLayerIds
} from 'src/app/map/config/layers/map-enums';
import {
  InterventionListComponent,
  ISelectedIntervention
} from 'src/app/shared/components/intervention-list/intervention-list.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import { AssetService } from 'src/app/shared/services/asset.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { UserService } from 'src/app/shared/user/user.service';

import { BaseMapComponent } from 'src/app/shared/components/base/base-map.component';
import { ExternalReferenceIdType, NexoService } from 'src/app/shared/services/nexo.service';
import { MapSourceId } from '../../shared/services/map-source.service';

const AREA_LAYER_IDS = [
  ...projectLayerIds,
  ...plannedProjectLayerIds,
  ...replannedProjectLayerIds,
  ...postponedProjectLayerIds
];

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.component.html',
  styleUrls: ['./project-details.component.scss']
})
export class ProjectDetailsComponent extends BaseMapComponent implements OnInit, OnDestroy {
  public ProjectType = ProjectType;
  public programBook: IEnrichedProgramBook;
  public categories: ITaxonomyList;
  public subCategories: ITaxonomyList;
  public fromYear: number;
  public projectInterventions: ISelectedIntervention[] = [];

  private hoveredInterventions: ISelectedIntervention[] = [];

  get mapShown(): boolean {
    const notShownStatuses = [ProjectStatus.canceled];
    return this.project && !notShownStatuses.includes(this.project.status as ProjectStatus) && !!this.project.geometry;
  }

  public get projectProgramBooks(): IEnrichedProgramBook[] {
    return this.projectService.getProjectProgramBooks(this.project);
  }

  public get projectProgram(): Observable<string> {
    return this.projectService.getProjectProgram(this.project);
  }

  @ViewChild('interventionList') public interventionList: InterventionListComponent;

  constructor(
    public dialogsService: DialogsService,
    windowService: WindowService,
    protected readonly mapService: MapService,
    activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly projectService: ProjectService,
    private readonly assetService: AssetService,
    private readonly userService: UserService
  ) {
    super(windowService, activatedRoute, mapService);
  }

  public async ngOnInit(): Promise<void> {
    await this.initTaxonomies();

    combineLatest(this.windowService.project$, this.mapService.mapLoaded$)
      .pipe(takeUntil(this.destroy$), takeUntil(this.projectService.projectChanged$))
      .subscribe(async ([project]) => {
        if (project) {
          await this.initProject();

          this.userService
            .hasPermission(Permission.ASSET_READ)
            .then(async hasPermissions => {
              if (hasPermissions) {
                await this.map.hoverService.init(this.map.map);
                this.updateMapAssets(this.projectInterventions);
                this.initMapAssetsEvents();
              }
            })
            .catch();
        }
      });
  }

  private async initTaxonomies(): Promise<void> {
    this.categories = await this.taxonomiesService
      .group(TaxonomyGroup.projectCategory)
      .pipe(take(1))
      .toPromise();
    this.subCategories = await this.taxonomiesService
      .group(TaxonomyGroup.projectSubCategory)
      .pipe(take(1))
      .toPromise();
  }

  private async initProject(): Promise<void> {
    this.fromYear = this.projectService.fromYear;
    this.projectService.fromYearChanged$.subscribe(year => this.onFromYearChange(year));
    this.setProjectInterventions();
    await this.setMapSource();
    const currentProject = this.windowService.currentProject;
    if (currentProject?.geometry) {
      this.mapService.fitZoomToGeometry(currentProject.geometry);
    }
    this.mapInitialized = true;
  }

  private setProjectInterventions(): void {
    if (!this.project.interventions?.length) {
      return;
    }
    this.projectInterventions = this.project.interventions.map(intervention => {
      return {
        intervention,
        assets: this.assetService.getSelectedAssetsFromIntervention(intervention)
      };
    });
  }

  private updateMapAssets(selectedInterventions: ISelectedIntervention[]): void {
    const enrichedInterventions = selectedInterventions.map(interventions => interventions.intervention);
    const assetGroups = this.assetService.getAssetGroupsFromInterventions(enrichedInterventions);
    this.mapService.resetAssetLayers();
    this.mapService.showAssetGroups(assetGroups);
    this.mapService.moveAssetGroupLayers(AREA_LAYER_IDS, assetGroups);

    const assets: IAsset[] = [];
    selectedInterventions.forEach(i => {
      assets.push(...i.assets.map(j => j.asset));
    });
    const nexoAssets = assets.filter(item => {
      if (
        NexoService.getExternalReferenceIdByTypes(item, [
          ExternalReferenceIdType.nexoAssetId,
          ExternalReferenceIdType.nexoReferenceNumber
        ])
      ) {
        return item;
      }
    });
    this.mapService.addExternalAssetsLayer(nexoAssets);
  }

  private initMapAssetsEvents(): void {
    this.interventionList?.interventionHoverEvent
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (intervention: ISelectedIntervention) => {
        await this.map.hoverService.clearHoverAsset();
        if (intervention?.assets.length) {
          intervention.assets.forEach(asset => this.map.hoverService.hover(asset.asset, true));
        }
      });

    this.map.hoverService.hoveredAssetFeatures$.pipe(takeUntil(this.destroy$)).subscribe(async features => {
      await this.map.hoverService.clearHoverAsset();

      this.hoveredInterventions.forEach(item => {
        this.interventionList.highlightIntervention(item.intervention.id, false);
      });
      this.hoveredInterventions = [];

      features.forEach(async feature => {
        const assetTypeId = await this.assetService.getAssetTypeAndIdFromAssetFeature(feature);
        const intervention = this.projectInterventions.find(item =>
          item.assets.find(asset => asset.assetId?.toString() === assetTypeId.assetId?.toString())
        );

        if (intervention) {
          if (intervention.assets.length) {
            intervention.assets.forEach(asset => this.map.hoverService.hover(asset.asset, true));
          }

          this.hoveredInterventions.push(intervention);
          this.interventionList.highlightIntervention(intervention.intervention.id, true);
        }
      });
    });
  }

  private async setMapSource(): Promise<void> {
    await this.mapService.setLayerVisibility(mapProjectAreaLogicLayers, true);
    await this.mapService.setLayerVisibility(mapProjectPinLogicLayers, false);
    this.mapService.patchLayers(mapProjectAreaLayerIds, { minzoom: 0 });
    this.map.dataService.setProjects(of([this.project]));
    await this.mapService.setLayerVisibility(['interventions'], true);
    this.map.sourceService.clearSource(MapSourceId.interventionCreationAreas);
    this.map.sourceService.clearSource(MapSourceId.interventionPins);
    await this.map.highlightService.clearHighlight();
  }

  private onFromYearChange(year: number): void {
    this.fromYear = year;
    this.map.sourceService.setProjectsSources([this.project]);
  }

  public editProject(): void {
    void this.router.navigate(['/window/projects/edit', this.project.id]);
  }
}

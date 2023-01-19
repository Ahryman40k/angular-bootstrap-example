import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ITaxonomy, ProjectStatus, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable, of } from 'rxjs';
import { map, startWith, take, takeUntil } from 'rxjs/operators';
import { mapProjectAreaLayerIds } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-layer-ids';
import { mapProjectAreaLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-logic-layers';
import { mapProjectPinLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-pin-logic-layers';
import { MapComponent } from 'src/app/map/map.component';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import {
  DecisionCreateCloseType,
  OpportunityNoticeModalComponent
} from 'src/app/shared/dialogs/opportunity-notice-modal/opportunity-notice-modal.component';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { NotificationAlertType } from 'src/app/shared/notifications/notification-alert';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AssetService } from 'src/app/shared/services/asset.service';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';
import { MapSourceId } from 'src/app/shared/services/map-source.service';
import { MapService } from 'src/app/shared/services/map.service';
import { IOpportunityNoticeFilter, OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { BaseDetailsComponent } from '../../base-details-component';

@Component({
  selector: 'app-opportunity-notices-create',
  templateUrl: './opportunity-notices-create.component.html',
  styleUrls: ['./opportunity-notices-create.component.scss']
})
export class OpportunityNoticesCreateComponent extends BaseDetailsComponent implements OnInit {
  @ViewChild('map') public map: MapComponent;
  public ObjectType = ObjectType;

  public requestors$: Observable<ITaxonomy[]>;
  public assetTypes$: Observable<ITaxonomy[]>;
  public filterFormControl: FormControl;
  public mapInitialized = false;
  public fromYear: number;
  public filters: IOpportunityNoticeFilter = { requestors: [], assetTypes: [] };

  get mapShown(): boolean {
    const notShownStatuses = [ProjectStatus.canceled];
    return (
      this.project &&
      this.mapInitialized &&
      !notShownStatuses.includes(this.project.status as ProjectStatus) &&
      !!this.project.geometry
    );
  }

  constructor(
    public mapService: MapService,
    private readonly projectService: ProjectService,
    private readonly opportunityNoticeService: OpportunityNoticeService,
    private readonly globalLayerService: GlobalLayerService,
    private readonly dialogsService: DialogsService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly assetService: AssetService,
    private readonly notificationsService: NotificationsService,
    private readonly router: Router,
    windowService: WindowService,
    activatedRoute: ActivatedRoute
  ) {
    super(windowService, activatedRoute);
  }

  public ngOnInit(): void {
    this.filterFormControl = new FormControl({ requestors: [], assetTypes: [] });
    this.loadTaxonomies();
    this.initObservables();
    this.initFilters();
  }

  public async createNonGeoOpportunityNotice(): Promise<void> {
    if (!this.canCreateOpportunityNotice()) {
      return;
    }

    const modalRef = this.dialogsService.showModal(OpportunityNoticeModalComponent);
    modalRef.componentInstance.init(this.project, undefined, undefined);
    const res = await modalRef.result;
    if (!this.project.isOpportunityAnalysis && res === DecisionCreateCloseType.created) {
      await this.windowService.refresh();
    }
  }

  public canCreateOpportunityNotice(): boolean {
    if (this.opportunityNoticeService.canCreateOpportunityNotice(this.project)) {
      return true;
    }

    this.notificationsService.show(
      `L'avis ne peut pas être créé pour un projet non-intégré ou en parachèvement.`,
      NotificationAlertType.warning
    );

    return false;
  }

  public changeToOpportunityNoticesPage(): void {
    void this.router.navigate([`../opportunity-notices/overview`], { relativeTo: this.activatedRoute });
  }

  private loadTaxonomies(): void {
    this.requestors$ = this.taxonomiesService.group(TaxonomyGroup.requestor).pipe(take(1));
    this.assetTypes$ = this.assetService.getActiveAssets();
  }

  private initObservables(): void {
    this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.initMap();
    });
    this.filterFormControl.valueChanges
      .pipe(takeUntil(this.destroy$), startWith({ requestors: [], assetTypes: [] }))
      .subscribe(filterValue => {
        this.opportunityNoticeService.changeFilters(filterValue);
      });
  }

  private initFilters(): void {
    this.opportunityNoticeService.filtersChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filterValue => (this.filters = filterValue));
  }

  private initMap(): void {
    this.windowService.project$.pipe(takeUntil(this.destroy$)).subscribe(async project => {
      if (project) {
        await this.initProject();
      }
    });
  }

  private async initProject(): Promise<void> {
    this.fromYear = this.projectService.fromYear;
    this.projectService.fromYearChanged$.subscribe(year => this.onFromYearChange(year));
    await this.setMapSource();
    const currentProject = this.windowService.currentProject;
    if (currentProject?.geometry) {
      this.mapService.fitZoomToGeometry(currentProject.geometry);
    }
    this.mapInitialized = true;
  }

  private async setMapSource(): Promise<void> {
    const layers = this.globalLayerService.getAllLayerSubGroups();
    await this.globalLayerService.setLayersVisibilityNotConsultationOnlyFromSubGroups(layers);
    await this.mapService.setLayerVisibility(mapProjectAreaLogicLayers, true);
    await this.mapService.setLayerVisibility(mapProjectPinLogicLayers, false);
    this.mapService.patchLayers(mapProjectAreaLayerIds, { minzoom: 0 });
    this.map.dataService.setProjects(of([this.project]));
    await this.mapService.setLayerVisibility(['interventions'], false);
    this.map.sourceService.clearSource(MapSourceId.interventionCreationAreas);
    this.map.sourceService.clearSource(MapSourceId.interventionPins);
  }

  private onFromYearChange(year: number): void {
    this.fromYear = year;
    this.map.dataService.setProjects(of([this.project]));
  }

  public setFilter(requestors: string[], assetTypes: string[]): void {
    if (requestors !== undefined) {
      this.filters.requestors = requestors ?? [];
    }
    if (assetTypes !== undefined) {
      this.filters.assetTypes = assetTypes ?? [];
    }

    this.opportunityNoticeService.changeFilters(this.filters);
  }
}

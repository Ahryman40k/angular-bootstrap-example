import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  InterventionStatus,
  InterventionType,
  IPlainIntervention
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { LngLat } from 'mapbox-gl';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { MapLogicLayer } from 'src/app/map/config/layers/logic-layers/map-logic-layer-enum';
import { disableFormControls, enableFormControls, markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapSourceId } from 'src/app/shared/services/map-source.service';
import { MapService } from 'src/app/shared/services/map.service';
import {
  IPlainOpportunityNoticeResponseProps,
  OpportunityNoticeResponseService
} from 'src/app/shared/services/opportunity-notice-response.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';
import { DialogsService } from '../../../../shared/dialogs/dialogs.service';
import { AssetService } from '../../../../shared/services/asset.service';
import { BrowserWindowService } from '../../../../shared/services/browser-window.service';
import { ShouldReEnableFormOnSubmit } from '../../base-intervention-form.component';
import { BaseInterventionCreationComponent } from '../base-intervention-creation.component';

const OPPORTUNITY_NOTICE_PARAM = 'opportunityNoticeId';
const FORM_CONTROL_NAMES = ['requestor', 'executor'];
@Component({
  selector: 'app-intervention-creation-non-geolocated-asset',
  templateUrl: 'intervention-creation-non-geolocated-asset.component.html',
  styleUrls: ['./intervention-creation-non-geolocated-asset.component.scss']
})
export class InterventionCreationNonGeolocatedAssetComponent extends BaseInterventionCreationComponent
  implements OnInit {
  private assetGeometry: IGeometry;
  private readonly suggestedStreetName$ = new BehaviorSubject<string>(null);
  private plainOpportunityNoticeResponseProps: IPlainOpportunityNoticeResponseProps;

  public drawAssetPosition: LngLat;
  public project: IEnrichedProject;

  constructor(
    taxonomiesService: TaxonomiesService,
    formBuilder: FormBuilder,
    interventionService: InterventionService,
    protected readonly assetService: AssetService,
    mapService: MapService,
    router: Router,
    notificationsService: NotificationsService,
    activatedRoute: ActivatedRoute,
    browserWindowService: BrowserWindowService,
    protected userRestrictionsService: UserRestrictionsService,
    protected spatialAnalysisService: SpatialAnalysisService,
    private readonly opportunityNoticeResponseService: OpportunityNoticeResponseService,
    protected dialogService: DialogsService
  ) {
    super(
      formBuilder,
      taxonomiesService,
      interventionService,
      mapService,
      router,
      notificationsService,
      activatedRoute,
      browserWindowService,
      dialogService,
      userRestrictionsService,
      spatialAnalysisService,
      assetService
    );
  }

  public async ngOnInit(): Promise<void> {
    super.ngOnInit();
    this.activatedRoute.params.pipe(filter(p => p.lat && p.lng)).subscribe(p => this.initialize(+p.lat, +p.lng));
    await this.initPlainOpportunityNotice();
    this.interventionArea = null;
  }

  private async initPlainOpportunityNotice(): Promise<void> {
    if (!this.hasOpportunityIdParam()) {
      return;
    }
    this.form.controls.interventionType.setValue(InterventionType.opportunity);

    this.plainOpportunityNoticeResponseProps = this.opportunityNoticeResponseService.getPlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );
    if (!this.plainOpportunityNoticeResponseProps) {
      this.notificationsService.showError('La session a été réinitialisée! Veuillez réessayer');
      await this.routeBackToOpportunityNotice();
    }

    this.setFormValue();
    disableFormControls(FORM_CONTROL_NAMES, this.form);

    // Defining years in interventionYear dropdown
    this.setYearsWithinProject(this.plainOpportunityNoticeResponseProps.project);

    this.mapService.mapLoaded$.subscribe(async () => this.setMapSource());
  }

  private setFormValue(): void {
    this.form.controls.requestor.setValue(this.plainOpportunityNoticeResponseProps.requestorId, {
      onlySelf: false,
      emitEvent: true
    });
    this.form.controls.executor.setValue(this.plainOpportunityNoticeResponseProps.project.executorId, {
      onlySelf: false,
      emitEvent: true
    });
    this.form.controls.contact.setValue(this.plainOpportunityNoticeResponseProps.contactInfo);
  }

  private getOpportunityNoticeParam(): string {
    return this.activatedRoute.snapshot.params.opportunityNoticeId;
  }

  private getProjectIdParam(): string {
    return this.activatedRoute.snapshot.params.projectId;
  }

  private async setMapSource(): Promise<void> {
    this.map.dataService.setProjects(of([this.plainOpportunityNoticeResponseProps.project]));
    await this.mapService.setLayerVisibility([MapLogicLayer.interventions], true);
    this.map.sourceService.clearSource(MapSourceId.projectCreation);
    this.map.sourceService.clearSource(MapSourceId.pastProjectsPins);
    this.map.sourceService.clearSource(MapSourceId.presentProjectsPins);
    this.map.sourceService.clearSource(MapSourceId.futureProjectsPins);
    this.mapService.fitZoomToGeometry(this.plainOpportunityNoticeResponseProps.project.geometry);
  }

  public initialize(lat: number, lng: number): void {
    if (isNaN(lat) || isNaN(lng)) {
      void this.router.navigate(['/not-found']);
      return;
    }
    this.drawAssetPosition = new LngLat(lng, lat);
  }

  public async assetDrawn(geometry: IGeometry): Promise<void> {
    const workArea = await this.interventionService.getWorkArea([geometry]);
    this.suggestedStreetName$.next(workArea.properties?.suggestedStreetName);
    const interventionArea = workArea.geometry as IGeometry;
    this.assetGeometry = geometry;
    this.drawAssetPosition = null;
    this.initInterventionArea(interventionArea);
    this.initDuplicateWarning();
  }

  protected getPlainIntervention(): IPlainIntervention {
    const initStatus = this.getOpportunityNoticeParam() ? InterventionStatus.waiting : InterventionStatus.wished;
    return super.getPlainIntervention({
      status: initStatus,
      assets: [
        {
          typeId: this.form.value.assetType,
          ownerId: this.form.value.assetOwner,
          suggestedStreetName: this.suggestedStreetName$.getValue()
        }
      ],
      interventionTypeId: this.hasOpportunityIdParam() ? InterventionType.opportunity : InterventionType.initialNeed
    });
  }

  protected generateInterventionName(): Promise<string> {
    return this.interventionService.generateInterventionName(
      this.form.controls.assetWorkType.value,
      this.form.controls.assetType.value,
      this.suggestedStreetName$.getValue()
    );
  }

  protected getInterventionNameDependencies(): Observable<any>[] {
    return [
      this.form.controls.assetType.valueChanges,
      this.form.controls.assetWorkType.valueChanges,
      this.suggestedStreetName$
    ];
  }

  protected getDuplicateInterventionDependencies(): Observable<any>[] {
    return [
      this.interventionArea$,
      this.form.controls.assetType.valueChanges,
      this.form.controls.requestor.valueChanges,
      this.form.controls.interventionYear.valueChanges
    ];
  }

  protected getDuplicateIntervention(): Observable<IEnrichedIntervention> {
    if (
      !this.interventionArea ||
      !this.form.value.assetType ||
      !this.form.value.requestor ||
      !this.form.value.interventionYear
    ) {
      return of(null);
    }
    return this.interventionService.getNonGeolocatedDuplicate(
      null,
      this.interventionArea,
      this.form.value.assetType,
      this.form.value.requestor,
      this.form.value.interventionYear
    );
  }

  private hasOpportunityIdParam(): boolean {
    return Object.keys(this.activatedRoute.snapshot.params).includes(OPPORTUNITY_NOTICE_PARAM);
  }

  public canCreateProject(): boolean {
    return !this.hasOpportunityIdParam();
  }

  public get isInterventionWithProgram(): boolean {
    return this.form.controls.program.value;
  }

  public async submitAndNavigate(): Promise<void> {
    markAllAsTouched(this.form);
    if (this.form.invalid) {
      return;
    }

    enableFormControls(FORM_CONTROL_NAMES, this.form);
    if (!this.hasOpportunityIdParam()) {
      await super.submitAndNavigate(BroadcastEventException.interventionCreate);
      return;
    }

    const intervention = await super.submit(ShouldReEnableFormOnSubmit.no);
    if (!intervention?.id) {
      return;
    }
    await this.opportunityNoticeResponseService.doNonGeoSubmission(intervention, this.getOpportunityNoticeParam());
    this.opportunityNoticeResponseService.deletePlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );
    await this.routeBackToOpportunityNotice();
  }

  private async routeBackToOpportunityNotice(): Promise<void> {
    await this.router.navigateByUrl(`/window/projects/${this.getProjectIdParam()}/opportunity-notices/overview`);
  }
}

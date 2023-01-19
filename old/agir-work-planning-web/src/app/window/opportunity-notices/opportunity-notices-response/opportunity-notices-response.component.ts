import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbCalendar, NgbDateNativeAdapter, NgbDateStruct } from '@ng-bootstrap/ng-bootstrap';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  IEnrichedOpportunityNotice,
  IPlainOpportunityNotice,
  ITaxonomy,
  ITaxonomyAssetTypeProperties,
  OpportunityNoticeResponsePlanningDecision,
  OpportunityNoticeResponseRequestorDecision,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, flatten, isEmpty, isNil, remove } from 'lodash';
import { Observable, of } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { mapProjectAreaLayerIds } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-layer-ids';
import { mapProjectAreaLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-area-logic-layers';
import { mapProjectPinLogicLayers } from 'src/app/map/config/layers/logic-layers/projects/map-project-pin-logic-layers';
import { MapComponent } from 'src/app/map/map.component';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { IAssetGroup } from 'src/app/shared/services/asset.service';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapAssetLayerService } from 'src/app/shared/services/map-asset-layer.service';
import { MapHighlightService } from 'src/app/shared/services/map-highlight/map-highlight.service';
import { MapSourceId } from 'src/app/shared/services/map-source.service';
import { MapService } from 'src/app/shared/services/map.service';
import {
  IAssetForIntervention,
  IPlainOpportunityNoticeResponseProps,
  OpportunityNoticeResponseService
} from 'src/app/shared/services/opportunity-notice-response.service';
import { OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { WindowService } from 'src/app/shared/services/window.service';
import { WORK_TYPE_RECONSTRUCTION } from 'src/app/shared/taxonomies/constants';

import { BaseDetailsComponent } from '../../base-details-component';

const suffix = '_WorkTypeId';
const defaultWorkTypeId = WORK_TYPE_RECONSTRUCTION;
@Component({
  selector: 'app-opportunity-notices-response',
  templateUrl: './opportunity-notices-response.component.html',
  styleUrls: ['./opportunity-notices-response.component.scss'],
  providers: [WindowService]
})
export class OpportunityNoticesResponseComponent extends BaseDetailsComponent implements OnInit {
  @ViewChild('map') public map: MapComponent;
  public ObjectType = ObjectType;

  public isMapLoading: boolean;

  public requestorDecisions: ITaxonomy[];
  public planningDecisionsTaxonomy$: Observable<ITaxonomy[]>;
  private _planningDecisionTaxonomies: ITaxonomy[] = [];
  public planningDecisions: ITaxonomy[];
  public OpportunityNoticeResponseRequestorDecision = OpportunityNoticeResponseRequestorDecision;
  public currentDecision: OpportunityNoticeResponseRequestorDecision;
  public currentDate: NgbDateStruct;

  public opportunityNotice$: Observable<IEnrichedOpportunityNotice>;
  public isLoadingOpportunityNotice = false;
  public plainOpportunityNotice: IPlainOpportunityNotice;
  public isSubmitting = false;
  public maxDate: NgbDateStruct;
  public workTypes: ITaxonomy[];

  public updateButtonLabel: string;
  public isWorkTypeForAllAssetsChecked = false;
  public assetForInterventionList: IAssetForIntervention[] = [];

  public get hasToDisplayAssetsToIntegrate(): boolean {
    return (
      this.currentDecision &&
      this.currentDecision === OpportunityNoticeResponseRequestorDecision.yes &&
      !isEmpty(this.plainOpportunityNotice.assets) &&
      this.form.controls.planningDecision.value === OpportunityNoticeResponsePlanningDecision.accepted
    );
  }

  public get planningDecisionTaxonomies(): ITaxonomy[] {
    return this._planningDecisionTaxonomies;
  }

  public set planningDecisionTaxonomies(taxonomies: ITaxonomy[]) {
    this._planningDecisionTaxonomies = taxonomies;
  }

  public get isFormValid(): boolean {
    return this.form.valid;
  }

  public form: FormGroup;
  public formAssets: FormGroup;
  constructor(
    private readonly opportunityNoticesService: OpportunityNoticeService,
    private readonly notificationsService: NotificationsService,
    private readonly fb: FormBuilder,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly calendar: NgbCalendar,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly opportunityNoticeResponseService: OpportunityNoticeResponseService,
    private readonly interventionService: InterventionService,
    private readonly globalLayerService: GlobalLayerService,
    private readonly mapService: MapService,
    private readonly mapAssetLayerService: MapAssetLayerService,
    private readonly mapHighlightService: MapHighlightService,
    windowService: WindowService
  ) {
    super(windowService, route);
  }

  public async ngOnInit(): Promise<void> {
    super.ngOnInit();
    this.activatedRoute.params.subscribe(async params => {
      await this.windowService.setProjectWithInterventions(params.id);
    });

    this.isLoadingOpportunityNotice = true;
    this.maxDate = this.calendar.getToday();
    this.plainOpportunityNotice = await this.fetchPlainOpportunityNotice();

    this.taxonomiesService
      .group(TaxonomyGroup.opportunityNoticeRequestorDecision)
      .pipe(take(1))
      .subscribe(requestorDecisions => {
        this.requestorDecisions = requestorDecisions;
      });
    this.planningDecisionsTaxonomy$ = this.taxonomiesService
      .group(TaxonomyGroup.opportunityPlaningDecision)
      .pipe(take(1));

    this.initForm(this.plainOpportunityNotice);
    this.initAssetInterventionList();
    this.initFormAsset();

    this.isLoadingOpportunityNotice = false;

    if (!isEmpty(this.plainOpportunityNotice.assets)) {
      const assetType = this.plainOpportunityNotice.assets[0].typeId;
      this.taxonomiesService
        .subGroupFromProperties({
          dependencyGroup: TaxonomyGroup.assetType,
          dependencyObservable: of(assetType),
          destroyEvent: this.destroy$,
          relationGroup: TaxonomyGroup.workType,
          relationSelector: (x: ITaxonomyAssetTypeProperties) => x?.workTypes
        })
        .pipe(take(1))
        .subscribe(workTypes => {
          this.workTypes = workTypes;
        });
    }
    this.loadMap();
  }

  private loadMap(): void {
    this.isMapLoading = true;
    this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(async () => {
      this.initMap();
      await this.updateMapAssets();
      this.isMapLoading = false;
    });
  }

  private initMap(): void {
    this.windowService.project$.pipe(takeUntil(this.destroy$)).subscribe(async project => {
      if (project) {
        await this.setMapSource();
        const currentProject = this.windowService.currentProject;
        if (currentProject?.geometry) {
          this.mapService.fitZoomToGeometry(currentProject.geometry);
        }
      }
    });
  }

  private async updateMapAssets(): Promise<void> {
    this.mapService.resetAssetLayers();
    const assetGroups = this.plainOpportunityNotice.assets.groupBy(a => a.typeId);
    const assetTypeAndIdsToLogicLayers: IAssetGroup[] = assetGroups.map(ag => ({
      type: ag.key as AssetType,
      ids: ag.items.map(i => i.id)
    }));
    this.mapService.showAssetGroups(assetTypeAndIdsToLogicLayers);
  }

  public async onAssetListHover(asset: IAsset): Promise<void> {
    await this.mapHighlightService.onAssetListHover([asset]);
  }

  public async clearHighlight(): Promise<void> {
    await this.mapHighlightService.clearHighlight();
  }

  private async setMapSource(): Promise<void> {
    const layers = this.globalLayerService.getAllLayerSubGroups();
    this.globalLayerService.setLayersVisibilityFromSubGroups(layers);
    await this.mapService.setLayerVisibility(mapProjectAreaLogicLayers, true);
    await this.mapService.setLayerVisibility(mapProjectPinLogicLayers, false);
    this.mapService.patchLayers(mapProjectAreaLayerIds, { minzoom: 0 });
    this.map.dataService.setProjects(of([this.project]));
    await this.mapService.setLayerVisibility(['interventions'], false);
    this.map.sourceService.clearSource(MapSourceId.interventionCreationAreas);
    this.map.sourceService.clearSource(MapSourceId.interventionPins);
  }

  private initForm(plainOpportunityNotice: IPlainOpportunityNotice): void {
    this.createForm();

    this.form.controls.requestorDecision.valueChanges.subscribe(code => {
      this.currentDecision = code;
      this.updateButtonLabel = this.getUpdateButtonLabel();
      this.resetPlannerDecision();
      this.updateFormValidation(code);
    });
    this.form.controls.planningDecision.valueChanges.subscribe(code => {
      if (code === OpportunityNoticeResponsePlanningDecision.rejected) {
        this.formAssets.reset();
      } else {
        this.initFormAsset();
        this.loadMap();
      }
    });
    this.form.controls.contactInfo.setValue(plainOpportunityNotice.contactInfo);

    if (this.plainOpportunityNotice.response) {
      this.initResponseForm(plainOpportunityNotice);
    } else {
      this.form.controls.requestorDecisionDate.setValue(this.calendar.getToday());
    }
  }

  private initResponseForm(plainOpportunityNotice: IPlainOpportunityNotice): void {
    this.form.controls.requestorDecision.setValue(plainOpportunityNotice.response.requestorDecision);
    this.form.controls.requestorDecisionDate.setValue(
      new NgbDateNativeAdapter().fromModel(new Date(plainOpportunityNotice.response.requestorDecisionDate))
    );
    this.form.controls.requestorDecisionNote.setValue(plainOpportunityNotice.response.requestorDecisionNote);

    this.disableResponseFormControls();

    if (this.currentDecision === OpportunityNoticeResponseRequestorDecision.yes) {
      this.form.controls.planningDecision.setValue(plainOpportunityNotice.response.planningDecision);
      this.form.controls.planningDecisionNote.setValue(plainOpportunityNotice.response.planningDecisionNote);
    }
  }

  private initAssetInterventionList(): void {
    const plainOpportunityNoticeResponseProps = this.opportunityNoticeResponseService.getPlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );

    this.assetForInterventionList = plainOpportunityNoticeResponseProps?.assetsForInterventions;
  }

  private initFormAsset(): void {
    this.formAssets = new FormGroup({
      workTypeForAllAssets: this.fb.control({ value: defaultWorkTypeId, disabled: true })
    });

    this.formAssets.controls.workTypeForAllAssets.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(controlValue => {
        const workTypeId = this.isWorkTypeForAllAssetsChecked ? controlValue : defaultWorkTypeId;
        this.plainOpportunityNotice.assets.forEach(asset => {
          this.putAssetsForInterventions(workTypeId, asset);
        });
      });

    this.plainOpportunityNotice.assets.forEach((asset: IAsset) => {
      const control: FormControl = this.fb.control(false);
      const controlWorkTypeId: FormControl = this.fb.control({ value: defaultWorkTypeId, disabled: true });

      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(controlValue => {
        if (controlValue) {
          this.formAssets.controls[`${asset.id}${suffix}`].enable();
          return;
        }
        this.removeAssetForInterventionList(this.assetForInterventionList, asset.id);
        this.formAssets.controls[`${asset.id}${suffix}`].disable();
      });

      controlWorkTypeId.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(controlValue => {
        if (!controlValue) {
          return;
        }
        const workTypeId = this.isWorkTypeForAllAssetsChecked
          ? this.formAssets.controls.workTypeForAllAssets.value
          : controlValue;
        this.putAssetsForInterventions(workTypeId, asset);
      });

      this.formAssets.addControl(asset.id, control);
      this.formAssets.addControl(`${asset.id}${suffix}`, controlWorkTypeId);
    });
  }

  private updateFormValidation(code: string): void {
    switch (code) {
      case OpportunityNoticeResponseRequestorDecision.yes:
        this.form.controls.requestorDecisionNote.setValidators([Validators.required]);
        this.form.controls.planningDecisionNote.setValidators([Validators.required]);
        this.form.controls.planningDecision.setValidators([Validators.required]);
        break;
      case OpportunityNoticeResponseRequestorDecision.no:
        this.form.controls.requestorDecisionNote.setValidators([Validators.required]);
        this.form.controls.planningDecisionNote.setValidators([]);
        this.form.controls.planningDecision.setValidators([]);
        break;
      default:
        this.form.controls.requestorDecisionNote.setValidators([]);
        this.form.controls.planningDecisionNote.setValidators([]);
        this.form.controls.planningDecision.setValidators([]);
    }
    this.form.controls.requestorDecisionNote.updateValueAndValidity();
    this.form.controls.planningDecisionNote.updateValueAndValidity();
    this.form.controls.planningDecision.updateValueAndValidity();
  }

  private getUpdateButtonLabel(): string {
    let buttonLabel: string;
    switch (this.currentDecision) {
      case OpportunityNoticeResponseRequestorDecision.no:
        buttonLabel = `Fermer l'avis`;
        break;
      default:
        buttonLabel = `Modifier`;
    }
    return buttonLabel;
  }

  private createForm(): void {
    this.form = this.fb.group({
      contactInfo: [null, Validators.required],
      requestorDecision: [null, Validators.required],
      requestorDecisionNote: [null],
      requestorDecisionDate: [null, Validators.required],
      planningDecision: [null],
      planningDecisionNote: [null]
    });
  }

  private resetPlannerDecision(): void {
    if (isNil(this.currentDecision) || this.currentDecision === OpportunityNoticeResponseRequestorDecision.yes) {
      return;
    }
    this.form.controls.planningDecision.reset();
    this.form.controls.planningDecisionNote.reset();
  }

  public async cancel(): Promise<void> {
    if (this.opportunityNoticeResponseService.handleCancel(this.getOpportunityNoticeParam())) {
      this.opportunityNoticeResponseService.deletePlainOpportunityNoticeInSessionStorage(
        this.getOpportunityNoticeParam()
      );
      await this.navigateToOpportunityList();
    } else {
      this.notificationsService.showError(
        `Une erreur est survenue lors de la suppression des interventions et/ou du retrait des interventions aux projets`
      );
    }
  }

  public disableResponseFormControls(): void {
    // We need to disable only on the return of the intervention's creation
    if (this.currentDecision !== OpportunityNoticeResponseRequestorDecision.yes) {
      return;
    }

    this.form.controls.requestorDecision.disable();
    this.form.controls.planningDecision.disable();
  }

  public async updateOpportunityNotice(): Promise<void> {
    const plainOpportunityNotice = this.getPlainOpportunityNotice();
    this.isSubmitting = true;
    this.form.disable();
    await this.executeOpportunityNoticeSequence(plainOpportunityNotice);
    this.isSubmitting = false;
  }

  private async executeOpportunityNoticeSequence(plainOpportunityNotice: IPlainOpportunityNotice): Promise<void> {
    this.opportunityNoticeResponseService.deletePlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );

    await this.executeOpportunitySequence(plainOpportunityNotice);
    await this.executeOpportunityInterventionSequence(plainOpportunityNotice);
  }

  private async executeOpportunityInterventionSequence(plainOpportunityNotice: IPlainOpportunityNotice): Promise<void> {
    if (
      this.currentDecision === OpportunityNoticeResponseRequestorDecision.yes &&
      this.form.controls.planningDecision.value === OpportunityNoticeResponsePlanningDecision.accepted
    ) {
      await this.navigateToNonGeoInterventionCreation(plainOpportunityNotice);
      await this.createOpportunityNoticeWithAssets(plainOpportunityNotice);
    }
  }

  private async executeOpportunitySequence(plainOpportunityNotice: IPlainOpportunityNotice): Promise<void> {
    if (this.form.controls.planningDecision.value === OpportunityNoticeResponsePlanningDecision.accepted) {
      return;
    }

    await this.executeUpdateOpportunityNotice(plainOpportunityNotice);
    await this.navigateToOpportunityList();
  }

  private async executeUpdateOpportunityNotice(plainOpportunityNotice: IPlainOpportunityNotice): Promise<void> {
    try {
      await this.opportunityNoticesService.updateOpportunityNotice(
        this.getOpportunityNoticeParam(),
        plainOpportunityNotice
      );
      this.notificationsService.showSuccess(`Avis d'opportunité modifié`);
      this.opportunityNoticesService.opportunityNoticeChanged$.subscribe(
        changed => (this.plainOpportunityNotice = changed)
      );
      this.isSubmitting = false;
      this.form.enable();
    } catch (e) {
      throw e;
    }
  }

  private getPlainOpportunityNotice(): IPlainOpportunityNotice {
    return {
      projectId: this.plainOpportunityNotice.projectId,
      object: this.plainOpportunityNotice.object,
      assets: this.plainOpportunityNotice.assets,
      requestorId: this.plainOpportunityNotice.requestorId,
      contactInfo: this.form.controls.contactInfo.value,
      followUpMethod: this.plainOpportunityNotice.followUpMethod,
      maxIterations: this.plainOpportunityNotice.maxIterations,
      notes: this.plainOpportunityNotice.notes.map(note => {
        return {
          text: note.text
        };
      }),
      response: {
        requestorDecision: this.form.controls.requestorDecision.value,
        requestorDecisionNote: this.form.value.requestorDecisionNote,
        requestorDecisionDate: new Date(
          this.form.controls.requestorDecisionDate.value.year,
          this.form.controls.requestorDecisionDate.value.month - 1,
          this.form.controls.requestorDecisionDate.value.day
        ).toISOString(),
        planningDecision: this.form.controls.planningDecision.value,
        planningDecisionNote: this.form.controls.planningDecisionNote.value
      }
    };
  }

  private async navigateToNonGeoInterventionCreation(plainOpportunityNotice: IPlainOpportunityNotice): Promise<void> {
    if (!isEmpty(plainOpportunityNotice?.assets)) {
      return;
    }
    const requestors = await this.taxonomiesService
      .group(TaxonomyGroup.requestor)
      .pipe(take(1))
      .toPromise();

    const plainOpportunityNoticeResponseProps: IPlainOpportunityNoticeResponseProps = {
      ...plainOpportunityNotice,
      requestorId: this.plainOpportunityNotice.requestorId,
      project: this.project
    };

    this.opportunityNoticeResponseService.requestorId = this.plainOpportunityNotice.requestorId;
    this.opportunityNoticeResponseService.putPlainOpportunityNoticeInSessionStorage(
      plainOpportunityNoticeResponseProps,
      this.getOpportunityNoticeParam()
    );
    await this.router.navigate([
      `/window/interventions/create`,
      {
        lat: this.project.geometryPin[1].toString(),
        lng: this.project.geometryPin[0].toString(),
        opportunityNoticeId: this.getOpportunityNoticeParam(),
        projectId: this.project.id
      }
    ]);
  }

  private async navigateToGeoInterventionsCreation(plainOpportunityNotice: IPlainOpportunityNotice): Promise<void> {
    if (isEmpty(plainOpportunityNotice?.assets)) {
      return;
    }

    const plainOpportunityNoticeResponseProps: IPlainOpportunityNoticeResponseProps = {
      ...plainOpportunityNotice,
      requestorId: this.plainOpportunityNotice.requestorId,
      project: this.project,
      assetsForInterventions: this.assetForInterventionList
    };

    this.opportunityNoticeResponseService.putPlainOpportunityNoticeInSessionStorage(
      plainOpportunityNoticeResponseProps,
      this.getOpportunityNoticeParam()
    );
    this.opportunityNoticeResponseService.requestorId = this.plainOpportunityNotice.requestorId;

    await this.router.navigate([
      `/window/create/opportunity-notice`,
      {
        opportunityNoticeId: this.getOpportunityNoticeParam(),
        projectId: this.project.id
      }
    ]);
  }

  private async createOpportunityNoticeWithAssets(plainOpportunityNotice: IPlainOpportunityNotice): Promise<void> {
    if (isEmpty(plainOpportunityNotice?.assets)) {
      return;
    }

    const plainOpportunityNoticeResponseProps: IPlainOpportunityNoticeResponseProps = {
      ...plainOpportunityNotice,
      requestorId: this.plainOpportunityNotice.requestorId,
      project: this.project,
      assetsForInterventions: this.assetForInterventionList
    };

    this.opportunityNoticeResponseService.putPlainOpportunityNoticeInSessionStorage(
      plainOpportunityNoticeResponseProps,
      this.getOpportunityNoticeParam()
    );
    this.opportunityNoticeResponseService.requestorId = this.plainOpportunityNotice.requestorId;

    if (!(await this.opportunityNoticeResponseService.doGeoSubmission(this.getOpportunityNoticeParam()))) {
      this.notificationsService.showError(`Une erreur est survenue lors de la mise à jour de l'avis d'opportunité`);
      return;
    }
    await this.navigateToOpportunityList();
  }

  private async navigateToOpportunityList(): Promise<void> {
    await this.router.navigateByUrl(
      `/window/projects/${this.plainOpportunityNotice.projectId}/opportunity-notices/overview`
    );
  }

  private putAssetsForInterventions(workTypeId: string, asset: IAsset): void {
    let assetForInterventionList = cloneDeep(this.assetForInterventionList);
    assetForInterventionList = this.removeAssetForInterventionList(assetForInterventionList, asset.id);
    this.assetForInterventionList = this.addAssetForInterventionList(assetForInterventionList, asset, workTypeId);
  }

  private addAssetForInterventionList(
    assetForInterventionList: IAssetForIntervention[],
    asset: IAsset,
    workTypeId: string
  ): IAssetForIntervention[] {
    if (!this.formAssets.controls[asset.id].value) {
      return assetForInterventionList;
    }
    const assetForIntervention = assetForInterventionList.find(
      innerAssetForIntervention =>
        innerAssetForIntervention.workTypeId === workTypeId && innerAssetForIntervention.toPersist
    );
    if (assetForIntervention) {
      assetForIntervention.assetList.push(asset);
    } else {
      assetForInterventionList.push({
        assetList: [asset],
        toPersist: true,
        workTypeId
      });
    }
    return assetForInterventionList;
  }

  private removeAssetForInterventionList(
    assetForInterventionList: IAssetForIntervention[],
    assetId: string
  ): IAssetForIntervention[] {
    if (!assetForInterventionList) {
      return [];
    }
    assetForInterventionList.forEach(assetForIntervention => {
      if (!assetForIntervention.toPersist) {
        return;
      }
      remove(assetForIntervention.assetList, asset => asset.id === assetId);
    });
    return this.removeEmptyAssetForIntervention(assetForInterventionList);
  }

  private removeEmptyAssetForIntervention(assetForInterventionList: IAssetForIntervention[]): IAssetForIntervention[] {
    const removedAssetForInterventionList = assetForInterventionList.map(assetForIntervention => {
      if (isEmpty(assetForIntervention.assetList)) {
        return null;
      }
      return assetForIntervention;
    });
    return removedAssetForInterventionList.filter(x => x);
  }

  public isAssetSelected(asset: IAsset): boolean {
    const assetList = flatten(
      this.assetForInterventionList.map(assetForIntervention => assetForIntervention.assetList)
    ).map(innerAsset => innerAsset.id);
    return assetList.includes(asset.id);
  }

  public selectAllAssets(): void {
    const alreadyPersistedAssetIdList =
      flatten(this.assetForInterventionList?.filter(afi => !afi.toPersist).map(afi => afi.assetList))?.map(
        asset => asset.id
      ) || [];
    this.plainOpportunityNotice.assets.forEach((asset: IAsset) => {
      if (alreadyPersistedAssetIdList.includes(asset.id)) {
        return;
      }
      this.formAssets.controls[asset.id].setValue(true);
    });
  }

  public activateWorktypeForAllAssets(isWorkTypeForAllAssetsChecked: boolean): void {
    if (!isWorkTypeForAllAssetsChecked) {
      this.formAssets.controls.workTypeForAllAssets.disable();
      this.plainOpportunityNotice.assets.forEach(asset => {
        this.formAssets.controls[`${asset.id}${suffix}`].enable();
      });
    } else {
      this.formAssets.controls.workTypeForAllAssets.enable();
      this.plainOpportunityNotice.assets.forEach(asset => {
        this.formAssets.controls[`${asset.id}${suffix}`].disable();
      });
    }
    this.isWorkTypeForAllAssetsChecked = isWorkTypeForAllAssetsChecked;
  }

  public getPersistedIntervention(asset: IAsset): IEnrichedIntervention {
    const plainOpportunityNoticeResponseProps = this.opportunityNoticeResponseService.getPlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );
    if (!asset || isEmpty(plainOpportunityNoticeResponseProps?.assetsForInterventions)) {
      return null;
    }

    for (const assetForIntervention of plainOpportunityNoticeResponseProps.assetsForInterventions) {
      if (!assetForIntervention.toPersist && assetForIntervention.assetList.map(a => a.id).includes(asset.id)) {
        return assetForIntervention.intervention;
      }
    }
    return null;
  }

  public getWorkTypePersistedValue(asset: IAsset): string {
    const plainOpportunityNoticeResponseProps = this.opportunityNoticeResponseService.getPlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );
    if (!plainOpportunityNoticeResponseProps) {
      return null;
    }

    for (const assetForIntervention of plainOpportunityNoticeResponseProps?.assetsForInterventions) {
      if (!assetForIntervention.toPersist && !assetForIntervention.assetList.map(a => a.id).includes(asset.id)) {
        continue;
      }
      return assetForIntervention.workTypeId;
    }

    return null;
  }

  public async createInterventions(): Promise<void> {
    await this.navigateToGeoInterventionsCreation(this.getPlainOpportunityNotice());
  }

  private getOpportunityNoticeParam(): string {
    return this.route.snapshot.params.opportunityNoticeId;
  }

  private async fetchPlainOpportunityNotice(): Promise<IPlainOpportunityNotice> {
    let opportunityNoticePromise: Promise<IPlainOpportunityNotice>;
    const plainOpportunityNoticeResponseProps = this.opportunityNoticeResponseService.getPlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );

    if (!plainOpportunityNoticeResponseProps) {
      const enrichedOpportunityNotice = (await this.opportunityNoticesService.getOpportunityNoticeById(
        this.getOpportunityNoticeParam()
      )) as any;
      enrichedOpportunityNotice.notes = enrichedOpportunityNotice.notes?.map(note => {
        return {
          text: note.text
        };
      });
      opportunityNoticePromise = of(enrichedOpportunityNotice as IPlainOpportunityNotice).toPromise();
    } else {
      delete plainOpportunityNoticeResponseProps.project;
      delete plainOpportunityNoticeResponseProps.assetsForInterventions;
      plainOpportunityNoticeResponseProps.notes = plainOpportunityNoticeResponseProps.notes?.map(note => {
        return {
          text: note.text
        };
      });
      opportunityNoticePromise = of(plainOpportunityNoticeResponseProps).toPromise();
    }
    return opportunityNoticePromise;
  }

  private hasAssetsChecked(): boolean {
    if (isEmpty(this.plainOpportunityNotice.assets)) {
      return false;
    }
    return this.plainOpportunityNotice.assets.every(
      (asset: IAsset) => this.formAssets.controls[asset.id].value === true
    );
  }

  public canCreateIntervention(): boolean {
    if (isEmpty(this.plainOpportunityNotice.assets)) {
      return false;
    }
    return (this.assetForInterventionList?.some(afi => afi.toPersist) || false) && this.form.valid;
  }

  private isInterventionNeeded(): boolean {
    let isNeeded = false;
    if (this.hasToDisplayAssetsToIntegrate) {
      isNeeded = !(
        !isNil(this.assetForInterventionList) &&
        !isEmpty(this.assetForInterventionList) &&
        this.assetForInterventionList.every(afi => !isNil(afi.intervention))
      );
    }
    return isNeeded;
  }

  public canSubmit(): boolean {
    return (
      !this.hasAssetsChecked() &&
      !this.isInterventionNeeded() &&
      !this.canCreateIntervention() &&
      this.form.valid &&
      !this.isSubmitting
    );
  }
}

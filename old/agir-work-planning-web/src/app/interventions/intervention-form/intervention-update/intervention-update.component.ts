import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AssetExpand,
  AssetType,
  IAsset,
  IAssetList,
  IAssetsWorkAreaSearchRequest,
  IEnrichedIntervention,
  IGeometry,
  InterventionExpand,
  InterventionStatus,
  IPlainIntervention,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty, min, uniqBy } from 'lodash';
import { from, Observable } from 'rxjs';
import { filter, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { arrayOfNumbers } from 'src/app/shared/arrays/number-arrays';
import { SpinnerOverlayService } from 'src/app/shared/components/spinner-overlay/spinner-overlay.service';
import { InterventionType } from 'src/app/shared/models/interventions/intervention-type';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { TaxonomyAssetService } from 'src/app/shared/services/taxonomy-asset.service';
import { UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { enumValues } from 'src/app/shared/utils/utils';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';

import { ISelectedAsset } from '../../../shared/components/asset-list/asset-list.component';
import { DialogsService } from '../../../shared/dialogs/dialogs.service';
import { AssetService } from '../../../shared/services/asset.service';
import { BrowserWindowService } from '../../../shared/services/browser-window.service';
import { MapHighlightService } from '../../../shared/services/map-highlight/map-highlight.service';
import { RoadSectionSelectionService } from '../../../shared/services/road-section-selection.service';
import {
  BaseInterventionFormComponent,
  INTERVENTION_UPDATE_MAX_YEAR_INTERVAL
} from '../base-intervention-form.component';
import { InterventionUpdateGeolocatedAssetBehavior } from './behaviors/intervention-update-geolocated-asset.behavior';
import { InterventionUpdateNonGeolocatedAssetBehavior } from './behaviors/intervention-update-non-geolocated-asset.behavior';
import { IInterventionUpdateBehavior } from './behaviors/intervention-update.behavior';

@Component({
  selector: 'app-intervention-update',
  templateUrl: 'intervention-update.component.html'
})
export class InterventionUpdateComponent extends BaseInterventionFormComponent implements OnInit {
  public isAssetHasProperties = false;
  public broadcastEventException = BroadcastEventException;
  private componentBehavior: IInterventionUpdateBehavior;

  public intervention$: Observable<IEnrichedIntervention>;
  public intervention: IEnrichedIntervention;

  public interventionSelectedAssets: ISelectedAsset[] = [];
  private addedSelectedAssets: ISelectedAsset[] = [];

  private isInitialized = false;
  public isLoadingWorkArea = false;

  private selectedRoadSections: any[] = [];
  private isSelectingAssets = false;

  private assetDataKeys: ITaxonomy[];

  public get isAssetGeolocated(): boolean {
    return !!this.intervention?.assets[0]?.id;
  }

  public get isLoaded(): boolean {
    return !this.isLoadingWorkArea && this.isInitialized;
  }

  constructor(
    taxonomiesService: TaxonomiesService,
    formBuilder: FormBuilder,
    interventionService: InterventionService,
    public readonly mapService: MapService,
    router: Router,
    notificationsService: NotificationsService,
    activatedRoute: ActivatedRoute,
    protected readonly assetService: AssetService,
    browserWindowService: BrowserWindowService,
    private readonly highlightService: MapHighlightService,
    private readonly roadSectionSelectionService: RoadSectionSelectionService,
    private readonly taxoAssetService: TaxonomyAssetService,
    private readonly spinnerOverlayService: SpinnerOverlayService,
    protected userRestrictionsService: UserRestrictionsService,
    protected spatialAnalysisService: SpatialAnalysisService,
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
    this.isInterventionCreate = false;
  }

  public async ngOnInit(): Promise<void> {
    this.spinnerOverlayService.show("Chargement de l'intervention en cours");
    this.intervention$ = this.activatedRoute.params.pipe(
      filter(p => p.interventionId),
      switchMap(p => from(this.interventionService.getIntervention(p.interventionId, [InterventionExpand.assets]))),
      tap(i => (this.intervention = i)),
      shareReplay()
    );
    this.assetDataKeys = await this.taxonomiesService
      .group(TaxonomyGroup.assetDataKey)
      .pipe(take(1))
      .toPromise();

    super.ngOnInit();

    this.intervention$.subscribe(async intervention => {
      this.initComponentBehavior();
      this.initFormValues();
      await this.initAssets();
      this.initInterventionArea(this.intervention.interventionArea.geometry);
      this.initInterventionAssetPinsOnMap(this.intervention.assets);
      this.setInterventionAssetPinsOnMap(this.intervention.assets);
      this.initDuplicateWarning();
      this.initSelectedRoadSectionsSubscription();
      this.isInitialized = true;
      this.isAssetHasProperties = this.taxoAssetService.hasProperties(intervention?.assets[0]?.typeId);
      this.form.controls.executor.setValue(this.intervention.executorId);
      this.spinnerOverlayService.hide();
    });
  }

  private initComponentBehavior(): void {
    this.componentBehavior = this.isAssetGeolocated
      ? new InterventionUpdateGeolocatedAssetBehavior(this, this.interventionService)
      : new InterventionUpdateNonGeolocatedAssetBehavior(this, this.interventionService);
  }

  private initFormValues(): void {
    this.form.reset({
      assetType: this.intervention.assets[0].typeId,
      assetOwner: this.intervention.assets[0].ownerId,
      assetWorkType: this.intervention.workTypeId,
      medal: this.intervention.medalId,
      requestor: this.intervention.requestorId,
      executor: this.intervention.executorId,
      contact: this.intervention.contact,
      estimate: this.intervention.estimate.allowance,
      program: this.intervention.programId,
      interventionType: this.intervention.interventionTypeId,
      interventionYear: this.intervention.interventionYear,
      interventionName: this.intervention.interventionName,
      planificationYear: this.intervention.planificationYear
    });
    this.form.controls.planificationYear.enable();
    if (
      !this.interventionService.statusesToEditPlanificationYear.includes(this.intervention.status) &&
      this.intervention
    ) {
      this.form.controls.planificationYear.disable();
    }
    if (this.intervention.project) {
      this.form.controls.executor.disable();
    } else {
      this.form.controls.executor.enable();
    }
    if (this.intervention.assets?.length > 1) {
      this.form.controls.assetType.disable({ emitEvent: false });
    }
    this.form.controls.interventionYear.disable();
  }

  private async initAssets(): Promise<void> {
    this.interventionSelectedAssets = [];
    if (isEmpty(this.addedSelectedAssets)) {
      this.addedSelectedAssets = await this.assetService.getSelectedAssetsFromAssets(
        this.intervention.assets,
        this.assetDataKeys
      );
    }

    this.interventionSelectedAssets = cloneDeep(this.addedSelectedAssets);
  }

  protected initYears(): void {
    this.intervention$.subscribe(i => {
      const lowestYear = min([new Date().getFullYear(), i.interventionYear, i.planificationYear]);
      this.years = arrayOfNumbers(lowestYear, lowestYear + INTERVENTION_UPDATE_MAX_YEAR_INTERVAL);
    });
  }

  public getPlainIntervention(): IPlainIntervention {
    const assets: IAsset[] = (!isEmpty(this.addedSelectedAssets)
      ? cloneDeep(this.addedSelectedAssets.map(a => a.asset))
      : cloneDeep(this.intervention.assets)
    ).map(asset => {
      return {
        ...asset,
        ownerId: this.form.value.assetOwner,
        typeId: this.form.value.assetType || asset.typeId
      };
    });

    return super.getPlainIntervention({
      // Properties that should not be modified.
      id: this.intervention.id,
      boroughId: this.intervention.boroughId,
      decisionRequired: this.intervention.decisionRequired,
      importFlag: this.intervention.importFlag,
      interventionYear: this.intervention.interventionYear,
      roadSections: this.intervention.roadSections,
      status: this.intervention.status,
      // Properties to update
      assets,
      interventionTypeId: this.form.value.interventionType
    });
  }

  public setIsSelectingAssets(isSelecting: boolean): void {
    this.isSelectingAssets = isSelecting;
  }

  protected canGenerateInterventionName(): boolean {
    return this.isInitialized;
  }

  protected async doSubmission(
    plainIntervention: IPlainIntervention,
    broadcastException?: BroadcastEventException
  ): Promise<IEnrichedIntervention> {
    const intervention = await this.interventionService.updateIntervention(plainIntervention, broadcastException);
    intervention
      ? this.notificationsService.showSuccess("L'intervention a été modifiée avec succès")
      : this.notificationsService.showError("Impossible d'effectuer cette opération");
    return intervention;
  }

  protected getDuplicateIntervention(): Observable<IEnrichedIntervention> {
    return this.componentBehavior.getDuplicateIntervention();
  }

  protected getDuplicateInterventionDependencies(): Observable<any>[] {
    return this.componentBehavior.getDuplicateInterventionDependencies();
  }

  protected generateInterventionName(): Promise<string> {
    return this.interventionService.generateInterventionName(
      this.form.controls.assetWorkType.value,
      this.form.controls.assetType.value,
      this.form.controls.streetName?.value
    );
  }

  private initSelectedRoadSectionsSubscription(): void {
    this.mapService.selectedRoadSections$.pipe(takeUntil(this.destroy$)).subscribe(async roadSections => {
      if (!roadSections?.length || !this.isSelectingAssets) {
        return;
      }
      this.selectedRoadSections.push(roadSections[roadSections.length - 1]);
      this.highlightService.highlightRoadSections(this.selectedRoadSections);
      await this.handleRoadSectionAssets(roadSections[roadSections.length - 1]);
    });
  }

  private async handleRoadSectionAssets(roadSection: any): Promise<void> {
    this.mapService.isLoadingRoadSection = true;
    let roadSectionAssets: IAssetList;
    if (roadSection && this.form.controls.assetType?.value) {
      roadSectionAssets = await this.roadSectionSelectionService.getRoadSectionAssets(
        roadSection,
        this.form.controls.assetType.value
      );
    }

    if (!roadSectionAssets?.length) {
      this.mapService.isLoadingRoadSection = false;
      return;
    }
    await this.addAssets(roadSectionAssets);
  }

  private async addAssets(assets: IAssetList): Promise<void> {
    const newAssets: IAssetList = assets.filter(
      asset =>
        !this.interventionSelectedAssets.find(selectedAsset => selectedAsset.asset.id === asset.id) &&
        this.assetService.isAssetIdValid(asset.id)
    );
    const noDuplicateAssets: IAssetList = uniqBy(newAssets, asset => asset.id);

    const selectedAssets = await this.assetService.getSelectedAssetsFromAssets(noDuplicateAssets, this.assetDataKeys);
    this.interventionSelectedAssets.push(...selectedAssets);

    this.setInterventionAssetPinsOnMap(noDuplicateAssets);
    this.mapService.isLoadingRoadSection = false;
  }

  public async onAssetListChange(assets: ISelectedAsset[]): Promise<void> {
    if (!assets.length) {
      return;
    }
    this.interventionSelectedAssets = assets;
    this.addedSelectedAssets = assets;
    await this.generateInterventionArea(this.interventionSelectedAssets);
    await this.map.highlightService.clearHighlightAsset();
    this.setInterventionAssetPinsOnMap(assets.map(a => a.asset));
  }

  public async onRoadSectionCancel(): Promise<void> {
    this.selectedRoadSections = [];
    await this.initAssets();
    await this.map.highlightService.clearHighlightAsset();
    this.setInterventionAssetPinsOnMap(this.addedSelectedAssets.map(a => a.asset));
  }

  public async onSubmitAssets(): Promise<void> {
    this.selectedRoadSections = [];
    this.addedSelectedAssets.push(
      ...this.interventionSelectedAssets.filter(a => !this.addedSelectedAssets.find(b => b.asset.id === a.asset.id))
    );
    await this.generateInterventionArea(this.interventionSelectedAssets);
  }

  protected async generateInterventionArea(assets: ISelectedAsset[]): Promise<void> {
    this.isLoadingWorkArea = true;
    await super.generateInterventionArea(assets);
    this.isLoadingWorkArea = false;
  }
}

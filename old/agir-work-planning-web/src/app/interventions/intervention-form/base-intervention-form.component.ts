import { OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  IGeometry,
  IPlainIntervention,
  ITaxonomy,
  ITaxonomyAssetTypeProperties,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEqual } from 'lodash';
import { combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, map, shareReplay, startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import {
  mapInterventionCreationLayerIds,
  mapInterventionLayerIds
} from 'src/app/map/config/layers/logic-layers/interventions/map-intervention-layer-ids';
import { ISelectedAsset } from 'src/app/shared/components/asset-list/asset-list.component';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { markAllAsTouched } from 'src/app/shared/forms/forms.utils';
import { InterventionType } from 'src/app/shared/models/interventions/intervention-type';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ExternalReferenceIdType, NexoService } from 'src/app/shared/services/nexo.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';

import { MapComponent } from '../../map/map.component';
import { DialogsService } from '../../shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../../shared/forms/confirmation-modal/confirmation-modal.component';
import { AssetService } from '../../shared/services/asset.service';
import { BrowserWindowService } from '../../shared/services/browser-window.service';
import { MapSourceId } from '../../shared/services/map-source.service';
import { SpatialAnalysisService } from '../../shared/services/spatial-analysis.service';
import { RestrictionType, UserRestrictionsService } from '../../shared/user/user-restrictions.service';

export enum ShouldReEnableFormOnSubmit {
  yes = 'yes',
  no = 'no'
}
export const INTERVENTION_CREATION_MAX_YEAR_INTERVAL = 10;
export const INTERVENTION_UPDATE_MAX_YEAR_INTERVAL = 50;
const INTERVENTION_DUPLICATE_DEBOUNCE = 1000;

export abstract class BaseInterventionFormComponent extends BaseComponent implements OnInit {
  public assetTypes$: Observable<ITaxonomy[]>;
  public assetOwners$: Observable<ITaxonomy[]>;
  public assetWorkTypes$: Observable<ITaxonomy[]>;
  public medalTypes$: Observable<ITaxonomy[]>;
  public requestors$: Observable<ITaxonomy[]>;
  public executors$: Observable<ITaxonomy[]>;
  public programs$: Observable<ITaxonomy[]>;
  public categories$: Observable<ITaxonomy[]>;
  public interventionTypes$: Observable<ITaxonomy[]>;
  public years: number[];

  public form: FormGroup;
  public boroughId: string;
  public map: MapComponent;

  protected isInterventionCreate = true;

  private interventionAreaOriginal: IGeometry;
  private _interventionArea: IGeometry;
  public get interventionArea(): IGeometry {
    return this._interventionArea;
  }
  public set interventionArea(v: IGeometry) {
    this._interventionArea = v;
    this.interventionArea$.next(v);
    void this.setInterventionAreaOnMap();
  }
  public interventionArea$ = new Subject<IGeometry>();

  public duplicateIntervention$: Observable<IEnrichedIntervention>;
  public submitting = false;

  public get isInterventionAreaEdited(): boolean {
    return !isEqual(this.interventionArea, this.interventionAreaOriginal);
  }

  constructor(
    private readonly formBuilder: FormBuilder,
    protected readonly taxonomiesService: TaxonomiesService,
    protected interventionService: InterventionService,
    protected mapService: MapService,
    protected router: Router,
    protected notificationsService: NotificationsService,
    protected activatedRoute: ActivatedRoute,
    protected browserWindowService: BrowserWindowService,
    protected dialogService: DialogsService,
    protected userRestrictionsService: UserRestrictionsService,
    protected spatialAnalysisService: SpatialAnalysisService,
    protected assetService: AssetService
  ) {
    super();
  }

  protected setBoroughId(): void {
    if (this.interventionArea) {
      this.spatialAnalysisService
        .getBorough(this.interventionArea)
        .then(res => {
          this.boroughId = res.id;
        })
        .catch(err => undefined);
    }
  }

  // return false when user have invalid restriction on BOROUGH
  public get isValidBoroughId(): boolean {
    return this.boroughId
      ? this.userRestrictionsService.validateOneByType({ BOROUGH: [this.boroughId] }, RestrictionType.BOROUGH)
      : true;
  }

  public ngOnInit(): void {
    this.initForm();
    this.initTaxonomies();
    this.initInterventionName();
    this.initYears();
    this.interventionArea$.subscribe(() => {
      this.setBoroughId();
    });

    combineLatest(
      this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)),
      this.form.controls.program.valueChanges
    ).subscribe(() => {
      this.map.sourceService.clearSource(MapSourceId.interventionCreationAreas);
      this.setInterventionAreaSource(!!this.form.controls.program.value);
    });
  }

  protected initForm(): void {
    this.form = this.formBuilder.group({
      assetType: [null, Validators.required],
      assetOwner: [null, Validators.required],
      assetWorkType: [null, Validators.required],
      executor: [null, Validators.required],
      requestor: [null, Validators.required],
      medal: [null],
      contact: [null],
      estimate: [null],
      program: [null],
      interventionType: [null, Validators.required],
      interventionYear: [null, Validators.required],
      interventionName: [null, Validators.required],
      planificationYear: [{ value: null, disabled: true }, Validators.required]
    });
    this.form.controls.assetType.valueChanges.subscribe(() => {
      this.form.patchValue({
        assetOwner: null,
        assetWorkType: null
      });
    });
  }

  protected async generateInterventionArea(assets: ISelectedAsset[]): Promise<void> {
    const assetsWorkArea = await this.assetService.searchAssetsWorkArea({
      assets: assets.map(el => {
        return { id: el.asset.id, type: el.asset.typeId };
      })
    });
    const interventionArea = assetsWorkArea.workArea.geometry as IGeometry;
    this.initInterventionArea(interventionArea);
    this.setInterventionAssetPinsOnMap(assets.map(a => a.asset));
  }

  private initTaxonomies(): void {
    this.assetTypes$ = this.getTaxonomyGroup(TaxonomyGroup.assetType).pipe(
      map(x => x.filter(t => t.properties.owners?.length && !t.properties.consultationOnly))
    );
    this.assetOwners$ = this.getAssetDependentGroup(TaxonomyGroup.assetOwner, x => x.owners);
    this.assetWorkTypes$ = this.getAssetDependentGroup(TaxonomyGroup.workType, x => x.workTypes);
    this.medalTypes$ = this.getTaxonomyGroup(TaxonomyGroup.medalType);
    this.requestors$ = this.getTaxonomyGroup(TaxonomyGroup.requestor);
    this.executors$ = this.getTaxonomyGroup(TaxonomyGroup.executor);
    this.programs$ = this.getTaxonomyGroup(TaxonomyGroup.programType);
    this.interventionTypes$ = this.getTaxonomyGroup(TaxonomyGroup.interventionType);
  }

  private initInterventionName(): void {
    const dependencies = this.getInterventionNameDependencies().map(o => o.pipe(startWith(null)));
    combineLatest(dependencies).subscribe(async values => {
      if (!this.canGenerateInterventionName() || values.every(x => x === null)) {
        return;
      }
      const interventionName = await this.generateInterventionName();
      this.form.controls.interventionName.setValue(interventionName);
    });
  }

  protected canGenerateInterventionName(): boolean {
    return true;
  }

  protected abstract initYears(): void;

  protected initInterventionArea(interventionArea: IGeometry): void {
    this.mapService.mapLoaded$.pipe(take(1)).subscribe(() => {
      this.interventionArea = interventionArea;
      this.interventionAreaOriginal = cloneDeep(interventionArea);
    });
  }

  protected initInterventionAssetPinsOnMap(assets: IAsset[]): void {
    this.mapService.mapLoaded$.pipe(take(1)).subscribe(() => {
      const assetGroup = {
        type: assets[0].typeId as AssetType,
        ids: assets.map(item => item.id)
      };

      this.mapService.resetAssetLayers();
      this.mapService.moveAssetGroupLayers(
        [...mapInterventionLayerIds, ...mapInterventionCreationLayerIds],
        [assetGroup]
      );
    });
  }

  protected initDuplicateWarning(): void {
    this.duplicateIntervention$ = combineLatest(
      this.getDuplicateInterventionDependencies().map(o => o.pipe(startWith(null)))
    ).pipe(
      debounceTime(INTERVENTION_DUPLICATE_DEBOUNCE),
      switchMap(() => this.getDuplicateIntervention()),
      shareReplay()
    );
  }

  public async submitAndNavigate(broadcastException?: BroadcastEventException): Promise<void> {
    const result = await this.displaySameYearInterventionCreationModal();
    if (result !== ConfirmationModalCloseType.confirmed) {
      return;
    }

    const intervention = await this.submit(ShouldReEnableFormOnSubmit.yes, broadcastException);

    if (!intervention) {
      return;
    }
    this.navigateToDetails(intervention);
  }

  protected displaySameYearInterventionCreationModal(): Promise<any> {
    const isCurrentYearSelected = this.form?.get('interventionYear')?.value === new Date().getFullYear();

    if (isCurrentYearSelected && this.isInterventionCreate) {
      const modal = this.dialogService.showConfirmationModal(
        'Créer une intervention',
        'Vous êtes en train de créer une intervention pour l’année en cours. Etes vous sûr de vouloir continuer?',
        'Soumettre'
      );
      return modal.result;
    }

    return new Promise(resolve => {
      resolve(ConfirmationModalCloseType.confirmed);
    });
  }

  /**
   * Submits the form.
   *
   * Marks all controls as touched to show the errors.
   * If the form is invalid it will not be executed.
   * Retrieves the plain intervention to submit and then submits it.
   * The child classes are responsible to override or implement the methods.
   */
  public async submit(
    reEnablingForm = ShouldReEnableFormOnSubmit.yes,
    broadcastException?: BroadcastEventException
  ): Promise<IEnrichedIntervention> {
    markAllAsTouched(this.form);
    if (this.form.invalid || !this.interventionArea) {
      if (!this.interventionArea) {
        this.notificationsService.showError("Veuillez définir une zone d'intervention");
      }
      return null;
    }

    this.submitting = true;
    try {
      const plainIntervention = this.getPlainIntervention();
      this.form.disable({ emitEvent: false });
      return await this.doSubmission(plainIntervention, broadcastException);
    } finally {
      if (reEnablingForm === ShouldReEnableFormOnSubmit.yes) {
        this.form.enable({ emitEvent: false });
        this.submitting = false;
      }
    }
  }

  public cancel(): void {
    window.history.length > 1 ? window.history.back() : window.close();
  }

  protected navigateToDetails(intervention: IEnrichedIntervention): void {
    const commands = intervention.project?.id
      ? ['/window/projects', intervention.project.id, 'interventions', intervention.id, 'overview']
      : ['/window/interventions', intervention.id, 'overview'];
    void this.router.navigate(commands);
  }

  protected getPlainIntervention(plainIntervention?: Partial<IPlainIntervention>): IPlainIntervention {
    const formValue = this.form.getRawValue();
    return {
      assets: [],
      boroughId: null,
      estimate: formValue.estimate || 0,
      interventionArea: {
        geometry: this.interventionArea,
        isEdited: this.isInterventionAreaEdited
      },
      interventionName: formValue.interventionName || null,
      interventionTypeId: InterventionType.initialNeed,
      interventionYear: +formValue.interventionYear,
      medalId: formValue.medal || null,
      planificationYear: +formValue.planificationYear,
      requestorId: formValue.requestor || null,
      executorId: formValue.executor,
      workTypeId: formValue.assetWorkType || null,
      audit: null,
      contact: formValue.contact || null,
      decisionRequired: null,
      id: null,
      importFlag: null,
      programId: formValue.program || null,
      roadSections: null,
      status: null,
      ...plainIntervention
    };
  }

  /**
   * Does the submission to the API.
   * Child classes must implement this method to make their own custom action.
   * @param plainIntervention The final plain intervention containing the full info to send to the API.
   */
  protected abstract doSubmission(
    plainIntervention: IPlainIntervention,
    broadcastException?: BroadcastEventException
  ): Promise<IEnrichedIntervention>;

  protected generateInterventionName(): Promise<string> {
    return this.interventionService.generateInterventionName(
      this.form.controls.assetWorkType.value,
      this.form.controls.assetType.value
    );
  }

  protected getInterventionNameDependencies(): Observable<any>[] {
    return [this.form.controls.assetType.valueChanges, this.form.controls.assetWorkType.valueChanges];
  }

  protected abstract getDuplicateIntervention(): Observable<IEnrichedIntervention>;

  protected abstract getDuplicateInterventionDependencies(): Observable<any>[];

  protected setInterventionAssetPinsOnMap(assets: IAsset[]): void {
    this.mapService.mapLoaded$.pipe(take(1)).subscribe(async () => {
      const assetGroup = {
        type: assets[0].typeId as AssetType,
        ids: assets.map(item => item.id)
      };
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

      this.mapService.showAssetGroups([assetGroup]);
      this.mapService.addExternalAssetsLayer(nexoAssets);
    });
  }

  private async setInterventionAreaOnMap(): Promise<void> {
    if (!this.interventionArea) {
      return;
    }

    // Shows the intervention area and fit zoom to it.
    this.setInterventionAreaSource();
    this.mapService.fitZoomToGeometry(this.interventionArea);
  }

  private setInterventionAreaSource(decisionRequired = false): void {
    if (!this.interventionArea) {
      return;
    }
    const intervention: IEnrichedIntervention = {
      id: null,
      decisionRequired,
      interventionArea: { geometry: this.interventionArea }
    } as IEnrichedIntervention;

    void this.map.highlightService.clearHighlight();
    void this.map.hoverService.clearHover();
    const features = this.interventionService.getAreaFeatures([intervention]);
    this.map.sourceService.setSource(MapSourceId.interventionCreationAreas, features);
  }

  private getAssetDependentGroup(
    group: TaxonomyGroup,
    selector: (properties: ITaxonomyAssetTypeProperties) => string[]
  ): Observable<ITaxonomy[]> {
    return this.taxonomiesService.subGroupFromProperties({
      dependencyGroup: TaxonomyGroup.assetType,
      dependencyObservable: this.form.controls.assetType.valueChanges,
      destroyEvent: this.destroy$,
      relationGroup: group,
      relationSelector: selector
    });
  }

  private getTaxonomyGroup(taxonomyGroup: TaxonomyGroup): Observable<ITaxonomy[]> {
    return this.taxonomiesService.group(taxonomyGroup).pipe(takeUntil(this.destroy$));
  }
  public removeInterventionArea(): void {
    this.interventionArea = null;
  }

  public async assetDrawn(geometry: IGeometry): Promise<void> {
    const workArea = await this.interventionService.getWorkArea([geometry]);
    const interventionArea = workArea.geometry as IGeometry;
    this.initInterventionArea(interventionArea);
    this.initDuplicateWarning();
  }
}

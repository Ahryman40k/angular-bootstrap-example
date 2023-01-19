import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import * as turf from '@turf/turf';
import {
  AssetExpand,
  IAsset,
  IAssetsWorkAreaSearchRequest,
  IEnrichedIntervention,
  IGeometry,
  InterventionStatus,
  IPlainIntervention,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty } from 'lodash';
import { Observable, of } from 'rxjs';
import { startWith, switchMap, take, takeUntil } from 'rxjs/operators';
import { ISelectedAsset } from 'src/app/shared/components/asset-list/asset-list.component';
import { InterventionType } from 'src/app/shared/models/interventions/intervention-type';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AssetService } from 'src/app/shared/services/asset.service';
import { GlobalLayerService } from 'src/app/shared/services/global-layer.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import {
  IAssetForIntervention,
  IPlainOpportunityNoticeResponseProps,
  OpportunityNoticeResponseService
} from 'src/app/shared/services/opportunity-notice-response.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { enumValues } from 'src/app/shared/utils/utils';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';

import { DialogsService } from '../../../../shared/dialogs/dialogs.service';
import { ConfirmationModalCloseType } from '../../../../shared/forms/confirmation-modal/confirmation-modal.component';
import { BrowserWindowService } from '../../../../shared/services/browser-window.service';
import { ShouldReEnableFormOnSubmit } from '../../base-intervention-form.component';
import { BaseInterventionCreationComponent } from '../base-intervention-creation.component';

@Component({
  selector: 'app-intervention-creation-opportunity-notice',
  templateUrl: 'intervention-creation-opportunity-notice.component.html',
  styleUrls: ['./intervention-creation-opportunity-notice.component.scss']
})
export class InterventionCreationOpportunityNoticeComponent extends BaseInterventionCreationComponent
  implements OnInit {
  public assetList: IAsset[] = [];
  public assetType: string;
  public assetOwners: ITaxonomy[];
  public assetOwnerId: string;
  public interventionName$: Observable<any>[];
  public interventionWorkTypeId: string;
  public contact: string;
  public requestorId: string;
  public plainOpportunityNoticeResponseProps: IPlainOpportunityNoticeResponseProps;
  public assetForIntervention: IAssetForIntervention;
  public projectId: string;

  // To display map and asset list
  public isLoading = true;
  public isLoadingAssets = true;
  public isReadOnly = true;

  private selectedAssets: ISelectedAsset[];

  constructor(
    taxonomiesService: TaxonomiesService,
    formBuilder: FormBuilder,
    interventionService: InterventionService,
    mapService: MapService,
    private readonly route: ActivatedRoute,
    router: Router,
    notificationService: NotificationsService,
    activatedRoute: ActivatedRoute,
    public assetService: AssetService,
    browserWindowService: BrowserWindowService,
    protected userRestrictionsService: UserRestrictionsService,
    protected spatialAnalysisService: SpatialAnalysisService,
    private readonly opportunityNoticeResponseService: OpportunityNoticeResponseService,
    protected readonly globalLayerService: GlobalLayerService,
    protected dialogService: DialogsService
  ) {
    super(
      formBuilder,
      taxonomiesService,
      interventionService,
      mapService,
      router,
      notificationService,
      activatedRoute,
      browserWindowService,
      dialogService,
      userRestrictionsService,
      spatialAnalysisService,
      assetService
    );
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.projectId = this.activatedRoute.snapshot.params.projectId;
    this.initNewProcess();
  }

  private initNewProcess(): void {
    this.plainOpportunityNoticeResponseProps = this.opportunityNoticeResponseService.getPlainOpportunityNoticeInSessionStorage(
      this.getOpportunityNoticeParam()
    );
    this.assetForIntervention = this.plainOpportunityNoticeResponseProps.assetsForInterventions.find(
      assetForIntervention => assetForIntervention.toPersist
    );
    this.resetForm();
    this.assetList = this.assetForIntervention.assetList;
    this.interventionWorkTypeId = this.assetForIntervention.workTypeId;
    this.contact = this.plainOpportunityNoticeResponseProps.contactInfo;

    // Defining years in interventionYear dropdown
    this.setYearsWithinProject(this.plainOpportunityNoticeResponseProps.project);
    this.disableFormControls();
    this.subscribeTaxonomyObservables();

    // Handle assets workarea
    this.initAssets()
      .then(async () => {
        this.loadMap();
        this.taxonomiesService
          .group(TaxonomyGroup.assetDataKey)
          .pipe(take(1))
          .subscribe(assetDataKeys => {
            this.assetService
              .getSelectedAssetsFromAssets(this.assetList, assetDataKeys)
              .then(selectedAssets => {
                this.assetService.setSelectedAssets(selectedAssets);
                this.selectedAssets = selectedAssets;
                this.isLoadingAssets = false;
              })
              .catch(() =>
                this.notificationsService.showError(
                  'Une erreur est survenue lors de la récupération de données des actifs'
                )
              );
          });

        const feature = await this.getInterventionAreaFeature();
        this.interventionArea = feature.geometry as IGeometry;

        const interventionName = await this.generateInterventionName();
        this.form.controls.interventionName.setValue(interventionName, { onlySelf: true, emitEvent: false });
        this.isLoading = false;
      })
      .catch(() => undefined);
  }

  private subscribeTaxonomyObservables(): void {
    this.assetWorkTypes$ = this.taxonomiesService.group('workType');

    this.assetTypes$.pipe(take(1)).subscribe(assetTypes => {
      this.assetType = assetTypes.find(assetT => assetT.code === this.assetList[0].typeId).code;
      const ownerCodes = assetTypes.find(assetT => assetT.code === this.assetList[0].typeId).properties.owners;
      this.form.controls.assetType.setValue(this.assetType);
      this.setAssetOwner(ownerCodes);
    });
  }

  private setAssetOwner(ownerCodes: string[]): void {
    if (!this.assetType) {
      return;
    }

    this.taxonomiesService
      .group('assetOwner')
      .pipe(take(1))
      .subscribe(assetOwners => {
        const filteredOwners = assetOwners.filter(assetOwner => ownerCodes.includes(assetOwner.code));
        // reasigning the input observable to auto refresh the owner select options
        this.assetOwners$ = of(filteredOwners);

        this.setAssetWorkType();
      });
  }

  private setAssetWorkType(): void {
    this.assetWorkTypes$.subscribe(assetWorkTypes => {
      this.form.controls.assetWorkType.reset(assetWorkTypes);
      this.form.controls.assetWorkType.setValue(this.interventionWorkTypeId);
    });
  }

  private async initAssets(): Promise<void> {
    let assets: IAsset[] = [];

    if (!isEmpty(this.assetList)) {
      assets = (
        await this.assetService.searchAssetsWorkArea({
          assets: this.assetList.map(el => {
            return { id: el.id, type: el.typeId };
          }),
          expand: enumValues<AssetExpand>(AssetExpand)
        })
      ).assets;
    }
    this.assetList = assets;
    this.initDuplicateWarning();
  }

  private async getInterventionAreaFeature(): Promise<turf.Feature> {
    if (this.assetList.length === 1) {
      this.interventionArea = this.assetList[0].workArea.geometry;
    }
    const geometries: IGeometry[] = [];
    for (const asset of this.assetList) {
      geometries.push(asset.workArea.geometry);
    }
    return this.interventionService.getWorkArea(geometries);
  }

  protected initForm(): void {
    super.initForm();
    this.form.controls.interventionType.setValue(InterventionType.opportunity);
  }

  protected generateInterventionName(): Promise<string> {
    return this.interventionService.generateInterventionName(
      this.form.controls.assetWorkType.value,
      this.form.controls.assetType.value,
      this.assetList[0]?.suggestedStreetName
    );
  }

  protected getDuplicateIntervention(): Observable<IEnrichedIntervention> {
    const requestor = this.form.controls.requestor.value;
    const interventionYear = this.form.controls.interventionYear.value;

    if (!requestor || !interventionYear || isEmpty(this.assetList)) {
      return of(null);
    }
    return this.interventionService.getGeolocatedDuplicate(
      null,
      this.assetList.map(asset => asset.id),
      requestor,
      interventionYear
    );
  }

  protected initDuplicateWarning(): void {
    this.duplicateIntervention$ = this.form.controls.interventionYear.valueChanges.pipe(
      startWith(null),
      takeUntil(this.form.controls.assetWorkType.valueChanges),
      switchMap(() => this.getDuplicateIntervention())
    );
  }

  protected getDuplicateInterventionDependencies(): Observable<any>[] {
    return [
      this.form.controls.requestor.valueChanges,
      this.form.controls.interventionYear.valueChanges,
      this.assetService.selectedAssets$
    ];
  }

  protected getInterventionNameDependencies(): Observable<any>[] {
    return [...super.getInterventionNameDependencies(), of(this.assetList[0])];
  }

  protected getPlainIntervention(): IPlainIntervention {
    const initStatus = this.getOpportunityNoticeParam() ? InterventionStatus.waiting : InterventionStatus.wished;
    return super.getPlainIntervention({
      status: initStatus,
      interventionTypeId: InterventionType.opportunity,
      assets: cloneDeep(this.assetList).map(asset => {
        return {
          ...asset,
          ownerId: this.form.controls.assetOwner.value
        };
      })
    });
  }

  private getOpportunityNoticeParam(): string {
    return this.route.snapshot.params.opportunityNoticeId;
  }

  public async submitAndNavigate(): Promise<void> {
    this.enableFormControls();

    const result = await this.displaySameYearInterventionCreationModal();
    if (result !== ConfirmationModalCloseType.confirmed) {
      return;
    }

    const intervention = await this.submit(
      ShouldReEnableFormOnSubmit.yes,
      BroadcastEventException.opportunityNoticeResponseInterventionCreation
    );
    if (!intervention) {
      this.disableFormControls();
      return;
    }

    // Persist in session storage the new properties for assetForIntervention
    this.assetForIntervention.intervention = intervention;
    this.putPlainOpportunityNoticeInSessionStorage();

    if (!(await this.opportunityNoticeResponseService.doPreGeoSubmission(this.getOpportunityNoticeParam()))) {
      // Persist in session storage the new properties for assetForIntervention
      delete this.assetForIntervention.intervention;
      this.assetForIntervention.toPersist = true;
      this.putPlainOpportunityNoticeInSessionStorage();
    } else {
      // If the submission goes well the intervention is created and the project is updated with the new intervention
      // Intervention which is integrated to a project is integrated so we change data in session storage to display it
      this.assetForIntervention.intervention.status = InterventionStatus.integrated;
      this.assetForIntervention.toPersist = false;
      this.plainOpportunityNoticeResponseProps.project.interventionIds.push(intervention.id);
      this.plainOpportunityNoticeResponseProps.project.interventions.push(intervention);
      this.putPlainOpportunityNoticeInSessionStorage();
    }

    await this.navigateToOpportunityNoticeResponseOrReinitProcess();
  }

  private putPlainOpportunityNoticeInSessionStorage(): void {
    this.opportunityNoticeResponseService.putPlainOpportunityNoticeInSessionStorage(
      this.plainOpportunityNoticeResponseProps,
      this.getOpportunityNoticeParam()
    );
  }

  private async navigateToOpportunityNoticeResponseOrReinitProcess(): Promise<void> {
    if (!this.isAllAssetForInterventionsPersisted()) {
      this.initNewProcess();
      return;
    }
    await this.router.navigateByUrl(
      `/window/projects/${this.projectId}/opportunity-notices/${this.getOpportunityNoticeParam()}/response`
    );
  }

  private isAllAssetForInterventionsPersisted(): boolean {
    return this.plainOpportunityNoticeResponseProps.assetsForInterventions.every(afi => !afi.toPersist);
  }

  private resetForm(): void {
    this.form.controls.estimate.reset(0);
    this.form.controls.program.reset();
    this.form.controls.interventionYear.reset(this.plainOpportunityNoticeResponseProps.project.startYear);
    this.form.controls.planificationYear.reset(this.plainOpportunityNoticeResponseProps.project.startYear);
    this.form.controls.interventionName.reset();
    this.form.controls.requestor.reset(this.plainOpportunityNoticeResponseProps.requestorId);
    this.form.controls.executor.reset(this.plainOpportunityNoticeResponseProps.project.executorId);
    this.form.controls.contact.reset(this.plainOpportunityNoticeResponseProps.contactInfo);
    this.form.markAsUntouched();
  }

  private disableFormControls(): void {
    this.form.controls.assetWorkType.disable();
    this.form.controls.requestor.disable();
    this.form.controls.interventionType.disable();
    this.form.controls.executor.disable();
  }

  private enableFormControls(): void {
    this.form.controls.assetWorkType.enable();
    this.form.controls.requestor.enable();
    this.form.controls.interventionType.enable();
    this.form.controls.executor.enable();
  }

  private loadMap(): void {
    this.mapService.mapLoaded$.pipe(take(1)).subscribe(() => {
      this.updateMapAssets();
    });
  }

  private updateMapAssets(): void {
    this.initInterventionAssetPinsOnMap(this.assetList);
    this.setInterventionAssetPinsOnMap(this.assetList);
  }
}

import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  InterventionStatus,
  InterventionType,
  IPlainIntervention,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep } from 'lodash';
import { Observable, of, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SpinnerOverlayService } from 'src/app/shared/components/spinner-overlay/spinner-overlay.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AssetService } from 'src/app/shared/services/asset.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';
import { TaxonomiesService } from 'src/app/shared/services/taxonomies.service';
import { UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';

import { DialogsService } from '../../../../shared/dialogs/dialogs.service';
import { BrowserWindowService } from '../../../../shared/services/browser-window.service';
import { BaseInterventionCreationComponent } from '../base-intervention-creation.component';

@Component({
  selector: 'app-intervention-creation-asset',
  templateUrl: 'intervention-creation-asset.component.html',
  styleUrls: ['./intervention-creation-asset.component.scss']
})
export class InterventionCreationAssetComponent extends BaseInterventionCreationComponent implements OnInit {
  public assetSubject = new Subject<IAsset>();
  public assets: IAsset[] = [];
  public broadcastEventException = BroadcastEventException;
  constructor(
    taxonomiesService: TaxonomiesService,
    formBuilder: FormBuilder,
    interventionService: InterventionService,
    mapService: MapService,
    router: Router,
    notificationService: NotificationsService,
    activatedRoute: ActivatedRoute,
    public assetService: AssetService,
    browserWindowService: BrowserWindowService,
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
    this.spinnerOverlayService.show();
    this.activatedRoute.params
      .pipe(filter(p => p.assetType && p.assetId))
      .subscribe(async p => this.initAsset(p.assetType, p.assetId));
  }

  public async initAsset(assetType: AssetType, assetId: string): Promise<void> {
    this.assets = [await this.assetService.get(assetType, assetId, ['workArea', 'suggestedStreetName'])];
    if (!this.assets.length) {
      this.notificationsService.showError("L'actif est introuvable");
      void this.router.navigate(['/not-found']);
      return;
    }
    this.form.controls.assetType.setValue(this.assets[0].typeId);
    this.assetSubject.next(this.assets[0]);
    this.initInterventionAssetPinsOnMap(this.assets);
    this.setInterventionAssetPinsOnMap(this.assets);
    this.initInterventionArea(this.assets[0].workArea.geometry);
    this.initDuplicateWarning();

    this.taxonomiesService.group(TaxonomyGroup.assetDataKey).subscribe(async assetDataKeys => {
      this.assetService.setSelectedAssets(
        await this.assetService.getSelectedAssetsFromAssets(this.assets, assetDataKeys)
      );
    });
  }

  protected initForm(): void {
    super.initForm();
  }

  protected generateInterventionName(): Promise<string> {
    return this.interventionService.generateInterventionName(
      this.form.controls.assetWorkType.value,
      this.form.controls.assetType.value,
      this.assets[0]?.suggestedStreetName
    );
  }

  protected getInterventionNameDependencies(): Observable<any>[] {
    return [...super.getInterventionNameDependencies(), this.assetSubject];
  }

  protected getDuplicateIntervention(): Observable<IEnrichedIntervention> {
    const requestor = this.form.controls.requestor.value;
    const interventionYear = this.form.controls.interventionYear.value;
    if (!requestor || !interventionYear || !this.assets[0]) {
      return of(null);
    }
    return this.interventionService.getGeolocatedDuplicate(null, this.assets[0]?.id, requestor, interventionYear);
  }

  protected getDuplicateInterventionDependencies(): Observable<any>[] {
    return [
      this.form.controls.requestor.valueChanges,
      this.form.controls.interventionYear.valueChanges,
      this.assetSubject
    ];
  }

  protected getPlainIntervention(): IPlainIntervention {
    const assets = cloneDeep(
      this.assets.map(asset => {
        return {
          ...asset,
          ownerId: this.form.value.assetOwner,
          typeId: this.form.value.assetType || asset.typeId
        };
      })
    );
    return super.getPlainIntervention({
      status: InterventionStatus.wished,
      assets
    });
  }
}

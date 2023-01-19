import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AssetType,
  IAsset,
  IEnrichedIntervention,
  IGeometry,
  InterventionStatus,
  IPlainIntervention
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep } from 'lodash';
import { combineLatest, Observable, of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { SpinnerOverlayService } from 'src/app/shared/components/spinner-overlay/spinner-overlay.service';
import { SpatialAnalysisService } from 'src/app/shared/services/spatial-analysis.service';
import { DEFAULT_EXECUTOR_CODE } from 'src/app/shared/taxonomies/constants';
import { UserRestrictionsService } from 'src/app/shared/user/user-restrictions.service';
import { BroadcastEventException } from 'src/app/shared/window/window-broadcast.service';

import { ISelectedAsset } from '../../../../shared/components/asset-list/asset-list.component';
import { DialogsService } from '../../../../shared/dialogs/dialogs.service';
import { NotificationsService } from '../../../../shared/notifications/notifications.service';
import { AssetService } from '../../../../shared/services/asset.service';
import { BrowserWindowService } from '../../../../shared/services/browser-window.service';
import { InterventionService } from '../../../../shared/services/intervention.service';
import { MapService } from '../../../../shared/services/map.service';
import { TaxonomiesService } from '../../../../shared/services/taxonomies.service';
import { BaseInterventionCreationComponent } from '../base-intervention-creation.component';

@Component({
  selector: 'app-intervention-creation-multiple-asset',
  templateUrl: './intervention-creation-multiple-asset.component.html',
  styleUrls: ['./intervention-creation-multiple-asset.component.scss']
})
export class InterventionCreationMultipleAssetComponent extends BaseInterventionCreationComponent implements OnInit {
  public assets$ = new Subject<ISelectedAsset[]>();
  public assets: ISelectedAsset[];
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
    protected userRestrictionsService: UserRestrictionsService,
    protected spatialAnalysisService: SpatialAnalysisService,
    private readonly spinnerOverlayService: SpinnerOverlayService,
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
    this.initAssets();
    this.form.controls.executor.setValue(DEFAULT_EXECUTOR_CODE);
  }

  private initAssets(): void {
    combineLatest(
      this.assetService.selectedAssets$.pipe(takeUntil(this.destroy$)),
      this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$))
    ).subscribe(async ([selectedAssets]) => {
      if (!selectedAssets?.length) {
        this.spinnerOverlayService.hide();
        this.notificationsService.showError('Une erreur est survenue, veuillez retourner à la carte!');
        return;
      }
      this.assets = selectedAssets;
      this.assets$.next(this.assets);
      this.initInterventionAssetPinsOnMap(selectedAssets.map(a => a.asset));

      const assetType = this.assetService.getAssetTypeFromTypeId(selectedAssets[0].asset.typeId);
      setTimeout(() => {
        this.form.controls.assetType.setValue(assetType);
        this.form.controls.assetType.disable();
      });

      await this.generateInterventionArea(selectedAssets);
      this.initDuplicateWarning();
    });
  }

  public async onAssetListChange(assets: ISelectedAsset[]): Promise<void> {
    if (!assets.length) {
      return;
    }
    this.assets$.next(assets);
    this.assets = assets;
    await this.generateInterventionArea(assets);
  }

  protected getPlainIntervention(): IPlainIntervention {
    const assets = cloneDeep(
      this.assets.map(asset => {
        return {
          ...asset.asset,
          ownerId: this.form.value.assetOwner,
          typeId: this.form.value.assetType || asset.asset.typeId
        };
      })
    );
    return super.getPlainIntervention({
      status: InterventionStatus.wished,
      assets
    });
  }

  protected generateInterventionName(): Promise<string> {
    if (!this.assets?.length) {
      return null;
    }
    return this.interventionService.generateInterventionName(
      this.form.controls.assetWorkType.value,
      this.form.controls.assetType.value,
      this.assets[0]?.asset.suggestedStreetName
    );
  }

  protected getDuplicateIntervention(): Observable<IEnrichedIntervention> {
    const requestor = this.form.controls.requestor.value;
    const interventionYear = this.form.controls.interventionYear.value;
    if (!requestor || !interventionYear || !this.assets[0]) {
      return of(null);
    }
    return this.interventionService.getGeolocatedDuplicate(
      null,
      this.assets.map(asset => asset.asset.id),
      requestor,
      interventionYear
    );
  }

  protected getDuplicateInterventionDependencies(): Observable<any>[] {
    return [this.form.controls.requestor.valueChanges, this.form.controls.interventionYear.valueChanges, this.assets$];
  }
}

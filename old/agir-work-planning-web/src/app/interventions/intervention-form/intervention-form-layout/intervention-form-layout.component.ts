import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import * as turf from '@turf/turf';
import {
  AssetType,
  IEnrichedIntervention,
  IEnrichedProject,
  IGeometry,
  ITaxonomy,
  OpportunityNoticeResponsePlanningDecision
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, isEmpty } from 'lodash';
import { LngLat } from 'mapbox-gl';
import { take, takeUntil } from 'rxjs/operators';
import { arrayOfNumbers } from 'src/app/shared/arrays/number-arrays';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { SpinnerOverlayService } from 'src/app/shared/components/spinner-overlay/spinner-overlay.service';
import { NotificationsService } from 'src/app/shared/notifications/notifications.service';
import { AssetService } from 'src/app/shared/services/asset.service';
import { MapRoadSectionHoverService } from 'src/app/shared/services/map-road-selection-hover.service';
import { MapSourceId } from 'src/app/shared/services/map-source.service';
import { MapService, MapZoomLevel } from 'src/app/shared/services/map.service';
import { ExternalReferenceIdType, NexoService } from 'src/app/shared/services/nexo.service';
import { OpportunityNoticeResponseService } from 'src/app/shared/services/opportunity-notice-response.service';
import { TaxonomyAssetService } from 'src/app/shared/services/taxonomy-asset.service';
import { WORK_TYPE_AMENAGEMENT } from 'src/app/shared/taxonomies/constants';

import { MapComponent } from '../../../map/map.component';
import { AssetListComponent, ISelectedAsset } from '../../../shared/components/asset-list/asset-list.component';
import { MapHighlightService } from '../../../shared/services/map-highlight/map-highlight.service';
import { DrawMode } from '../../../shared/services/map-tool.service';
import { RestrictionType, UserRestrictionsService } from '../../../shared/user/user-restrictions.service';

@Component({
  selector: 'app-intervention-form-layout',
  templateUrl: 'intervention-form-layout.component.html'
})
export class InterventionFormLayoutComponent extends BaseComponent implements OnInit, OnChanges {
  public isMinimized = false;
  public isRoadSectionSelectionEnabled = false;
  public isAreaEditionEnabled = false;
  public placeholder = 'En milliers de dollars : (0,000)';
  public precision = 3;
  @Input() public isAssetHasProperties;
  @Input() public buttonLabel: string;
  // false when user have invalid restrictions on borough
  @Input() public isValidBoroughId: boolean = true;

  @Input() public form: FormGroup;

  protected _submitting: boolean;
  public get submitting(): boolean {
    return this._submitting;
  }
  @Input()
  public set submitting(v: boolean) {
    this._submitting = v;
    if (this.isAreaEditionEnabled) {
      this.cancelInterventionArea();
    }
  }
  private _requestors: ITaxonomy[] = [];
  public get requestors(): ITaxonomy[] {
    return this._requestors;
  }
  @Input() public set requestors(v: ITaxonomy[]) {
    this._requestors = this.userRestrictionsService.filterTaxonomies(v, RestrictionType.REQUESTOR);
  }

  private _executors: ITaxonomy[] = [];
  public get executors(): ITaxonomy[] {
    return this._executors;
  }
  @Input() public set executors(v: ITaxonomy[]) {
    this._executors = this.userRestrictionsService.filterTaxonomies(v, RestrictionType.EXECUTOR);
  }

  @Input() public assets: ISelectedAsset[]; // Used for multiple assets
  @Input() public intervention: IEnrichedIntervention;
  @Input() public duplicateIntervention: IEnrichedIntervention;
  @Input() public project: IEnrichedProject;

  @Input() public assetTypes: ITaxonomy[];
  @Input() public assetOwners: ITaxonomy[];
  @Input() public assetWorkTypes: ITaxonomy[];
  @Input() public medalTypes: ITaxonomy[];

  @Input() public programs: ITaxonomy[];
  @Input() public categories: ITaxonomy[];
  @Input() public interventionTypes: ITaxonomy[];
  @Input() public years: number[];
  @Input() public isLoadingAssets = false;
  @Input() public isReadOnly = false;

  @Input() public interventionArea: IGeometry;
  @Output() public interventionAreaChange = new EventEmitter<IGeometry>();
  @Output() public isSelectingAssets = new EventEmitter<boolean>();

  @ViewChild('estimate') public estimate: ElementRef;
  public estimateValue: string;

  protected _map: MapComponent;
  public get map(): MapComponent {
    return this._map;
  }

  @ViewChild('map')
  public set map(v: MapComponent) {
    this._map = v;
    this.mapChange.emit(v);
  }
  @Output()
  public mapChange = new EventEmitter<MapComponent>();

  protected _drawAssetPosition: LngLat;
  public get drawAssetPosition(): LngLat {
    return this._drawAssetPosition;
  }
  @Input()
  public set drawAssetPosition(v: LngLat) {
    this._drawAssetPosition = v;
    if (v) {
      this.mapService.mapLoaded$.pipe(take(1)).subscribe(() => {
        const point = turf.point([v.lng, v.lat]).geometry;
        this.mapService.goToGeometryCenter(point, MapZoomLevel.INTERVENTION);
      });
    }
  }

  @Output() public cancel = new EventEmitter();
  @Output() public submit = new EventEmitter();
  @Output() public removeInterventionArea = new EventEmitter();
  @Output() public onAssetChange = new EventEmitter<ISelectedAsset[]>();
  @Output() public onRoadSectionCancel = new EventEmitter();
  @Output() public onSubmitAssets = new EventEmitter();

  /**
   * Temporary in-memory field to save the edited intervention area.
   */
  public interventionAreaEdit: IGeometry;

  @Output() public drawnAssetChange = new EventEmitter<IGeometry>();
  public drawingAsset = false;
  public openDrawAssetModal = false;
  public drawMode: DrawMode;

  private _showAssetType = true;

  public isMapLoading = true;
  public isEditingAssets = false;

  public get isInterventionAssetWorkTypeAmenagement(): boolean {
    return this.form.value.assetWorkType === WORK_TYPE_AMENAGEMENT;
  }

  public get isInterventionCreationOnOpportunityNoticeAcceptance(): boolean {
    const plainOpportunityNoticeResponseProps = this.opportunityNoticeResponseService.getPlainOpportunityNoticeInSessionStorage(
      this.activatedRoute.snapshot.params.opportunityNoticeId
    );
    return (
      plainOpportunityNoticeResponseProps?.response?.planningDecision ===
      OpportunityNoticeResponsePlanningDecision.accepted
    );
  }

  public get canEditAssets(): boolean {
    return (
      this.intervention &&
      !NexoService.getExternalReferenceIdByTypes(this.intervention, [ExternalReferenceIdType.nexoReferenceNumber])
    );
  }

  @ViewChild('assetList') public assetList: AssetListComponent;
  private hoveredAssets: ISelectedAsset[] = [];

  constructor(
    private readonly assetService: AssetService,
    private readonly mapService: MapService,
    private readonly notificationsService: NotificationsService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly opportunityNoticeResponseService: OpportunityNoticeResponseService,
    private readonly highlightService: MapHighlightService,
    private readonly hoverService: MapRoadSectionHoverService,
    private readonly taxoAssetService: TaxonomyAssetService,
    private readonly userRestrictionsService: UserRestrictionsService,
    private readonly spinnerOverlayService: SpinnerOverlayService
  ) {
    super();
  }

  public isAssetTypeDisplayable(): boolean {
    return this._showAssetType;
  }

  public ngOnInit(): void {
    this.mapService.mapLoaded$.pipe(takeUntil(this.destroy$)).subscribe(async () => {
      await this.map.hoverService.init(this.map.map);
      this.initMapAssetsEvents();
    });
    this.form?.controls?.estimate?.valueChanges.subscribe(estimate => {
      this.estimateValue = estimate
        ?.toString()
        .split('.')
        .join(',');
    });
  }

  public get assetType(): AssetType {
    return this.assetService.getAssetTypeFromTypeId(this.form.controls.assetType.value);
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.intervention?.currentValue) {
      this.estimateValue = this.form.controls.estimate.value
        .toString()
        .split('.')
        .join(',');
    }

    if (!isEmpty(changes.assets?.currentValue)) {
      const asset = changes.assets.currentValue.find((x: ISelectedAsset) => x)?.asset;
      this._showAssetType = !asset;
      this.isAssetHasProperties = this.taxoAssetService.hasProperties(asset?.typeId);
      this.spinnerOverlayService.hide();
    }
    if (changes.interventionArea?.currentValue !== undefined) {
      this.isMapLoading = false;
    }
  }

  public setEstimate(estimate: number): void {
    this.form.controls.estimate.setValue(
      parseFloat(
        estimate
          .toString()
          .split(',')
          .join('.')
      )
    );
  }

  private initMapAssetsEvents(): void {
    this.assetList?.assetHoverEvent.pipe(takeUntil(this.destroy$)).subscribe(async (asset: ISelectedAsset) => {
      await this.map.hoverService.clearHoverAsset();
      if (asset) {
        this.map.hoverService.hover(asset.asset, true);
      }
    });

    this.map.hoverService.hoveredAssetFeatures$.pipe(takeUntil(this.destroy$)).subscribe(async features => {
      await this.map.hoverService.clearHoverAsset();

      this.hoveredAssets.forEach(item => {
        this.assetList.highlightAsset(item.assetId, false);
      });
      this.hoveredAssets = [];

      features.forEach(async feature => {
        const assetTypeId = await this.assetService.getAssetTypeAndIdFromAssetFeature(feature);
        const asset = this.assets.find(item => item.assetId.toString() === assetTypeId.assetId.toString());
        if (asset) {
          this.hoveredAssets.push(asset);
          this.map.hoverService.hover(asset.asset, true);
          this.assetList.highlightAsset(asset.assetId, true);
        }
      });
    });
  }

  public get planificationYears(): number[] {
    const currentYear = new Date().getFullYear();
    return this.intervention ? arrayOfNumbers(currentYear, currentYear + 10) : [new Date().getFullYear()];
  }

  public editInterventionArea(): void {
    this.isAreaEditionEnabled = true;
    this.stopSelectingRoadSections();
    this.interventionAreaEdit = cloneDeep(this.interventionArea);
    this.map.toolService.startGeometryEditor(this.interventionAreaEdit, geometry =>
      this.onInterventionAreaDone(geometry)
    );
  }

  public cancelInterventionArea(): void {
    this.map.toolService.currentTool?.cancel();
    this.isAreaEditionEnabled = false;
    this.interventionAreaEdit = null;
    this.map.selectionService.start();
  }

  public toggleMinimized(): void {
    this.isMinimized = !this.isMinimized;
  }

  public onAssetListChange(newAssets: ISelectedAsset[]): void {
    void this.map.hoverService.clearHoverAsset();
    this.hoveredAssets = [];
    this.onAssetChange.emit(newAssets);
  }

  public async onAssetListHover(asset: ISelectedAsset): Promise<void> {
    await this.map.hoverService.clearHoverAsset();
    if (asset) {
      this.map.hoverService.hover(asset.asset, true);
    }
  }

  public validateInterventionArea(): void {
    this.map.toolService.currentTool.done();
  }

  private onInterventionAreaDone(geometry: IGeometry): void {
    if (!geometry || !this.mapService.isGeometryValid(geometry)) {
      this.notificationsService.showError("La zone d'intervention est invalide.");
    } else {
      this.interventionArea = geometry;
      this.interventionAreaChange.emit(geometry);
    }
    this.cancelInterventionArea();
  }

  public submitAssets(): void {
    this.isEditingAssets = false;
    this.isRoadSectionSelectionEnabled = false;

    if (this.isAreaEditionEnabled && this.interventionAreaEdit !== null) {
      // After the tool to edit the geometry is used , validate and prodeed with the following
      this.map.toolService.currentTool.done();
    } else {
      // After the tool to selection sections is used , validate and prodeed with the following
      this.onSubmitAssets.emit();
      this.stopRoadSectionManipulation();
    }
  }

  public cancelDrawAsset(): void {
    this.drawingAsset = false;
    this.cancelCurrentTool();
  }

  private cancelCurrentTool(): void {
    this.drawMode = null;
    this.map.toolService.currentTool?.cancel();
  }

  public editAssetSelection(): void {
    this.isEditingAssets = true;
    this.interventionAreaEdit = null;
  }

  public selectDrawAsset(): void {
    this.drawingAsset = true;
    this.openDrawAssetModal = true;
  }

  public startDrawAsset(): void {
    this.drawingAsset = true;
    this.openDrawAssetModal = false;
    this.map.toolService.startDrawGeometry(DrawMode.drawPolygon, geometry => this.onDrawnAssetDone(geometry));
  }

  public validateDrawnAsset(): void {
    this.map.toolService.currentTool.done();
  }

  public selectRoadSections(): void {
    this.isRoadSectionSelectionEnabled = true;
    this.isAreaEditionEnabled = false;
    this.clearRoadSections();
    this.isSelectingAssets.emit(true);
    this.hoverService.init(this.map.map);
    this.hoverService.initRoadSectionSelectionHover();
    this.highlightService.setRoadSectionVisibility('visible');
    this.mapService.activateRoadSectionSelection();
  }

  public cancelAssetSelection(): void {
    this.isRoadSectionSelectionEnabled = false;
    this.isAreaEditionEnabled = false;
    this.isEditingAssets = false;
    this.interventionAreaEdit = null;

    this.stopRoadSectionManipulation();
    this.onRoadSectionCancel.emit();
  }

  public removeAssetSelection(): void {
    this.removeInterventionArea.emit();
    this.cancelAssetSelection();
    this.cancelCurrentTool();
    this.drawingAsset = false;
    this.map.sourceService.setSource(MapSourceId.interventionCreationAreas, []);
  }
  public stopSelectingRoadSections(): void {
    this.isRoadSectionSelectionEnabled = false;
    this.stopRoadSectionManipulation();
    this.onRoadSectionCancel.emit();
  }

  private stopRoadSectionManipulation(): void {
    this.clearRoadSections();
    this.hoverService.disableRoadSectionVisibility();
    this.highlightService.setRoadSectionVisibility('none');
    this.map.toolService.currentTool?.cancel();
    this.map.selectionService.start();
  }

  private clearRoadSections(): void {
    this.highlightService.clearRoadSectionHighlights(this.mapService.selectedRoadSectionsSubject.value);
    this.mapService.clearRoadSectionsSelection();
  }

  private onDrawnAssetDone(geometry: IGeometry): void {
    if (!geometry || !this.mapService.isGeometryValid(geometry)) {
      this.notificationsService.showError("L'actif dessiné est invalide.");
    } else {
      this.drawnAssetChange.emit(geometry);
    }
    this.cancelDrawAsset();
  }
}

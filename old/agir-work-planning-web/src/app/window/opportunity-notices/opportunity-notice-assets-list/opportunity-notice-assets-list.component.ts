import { Component, Input, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  AssetType,
  IAsset,
  IEnrichedOpportunityNotice,
  IEnrichedProject,
  ISearchAssetsRequest,
  OpportunityNoticeStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, concat, filter as filterLodash, orderBy, remove, uniq } from 'lodash';
import { BehaviorSubject, combineLatest, from, merge, Observable } from 'rxjs';
import { map, shareReplay, startWith, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { DialogsService } from 'src/app/shared/dialogs/dialogs.service';
import {
  DecisionCreateCloseType,
  OpportunityNoticeModalComponent
} from 'src/app/shared/dialogs/opportunity-notice-modal/opportunity-notice-modal.component';
import { SortDirection } from 'src/app/shared/forms/sort/sort-utils';
import { OpportunityNoticeFilterKey } from 'src/app/shared/models/opportunity-notices/opportunity-notices';
import { AssetService } from 'src/app/shared/services/asset.service';
import { MapAssetLayerService } from 'src/app/shared/services/map-asset-layer.service';
import { MapHighlightService } from 'src/app/shared/services/map-highlight/map-highlight.service';
import { MapService } from 'src/app/shared/services/map.service';
import { OpportunityNoticeService } from 'src/app/shared/services/opportunity-notice.service';
import { WindowService } from 'src/app/shared/services/window.service';

import { BaseDetailsComponent } from '../../base-details-component';
import { OpportunityNoticesCreateComponent } from '../opportunity-notices-create/opportunity-notices-create.component';

export const defaultFilter = {
  key: OpportunityNoticeFilterKey.typeId,
  direction: SortDirection.desc
};
export interface IAssetGroupByType {
  key: string;
  items: IAsset[];
  icon?: string;
  hasOpportunityNotice?: boolean;
}
@Component({
  selector: 'app-opportunity-notice-assets-list',
  templateUrl: './opportunity-notice-assets-list.component.html',
  styleUrls: ['./opportunity-notice-assets-list.component.scss']
})
export class OpportunityNoticeAssetsListComponent extends BaseDetailsComponent implements OnInit {
  @Input() public fetchAssets: (
    project: IEnrichedProject,
    searchAssetParams: ISearchAssetsRequest
  ) => Promise<IAsset[]>;

  @Input() public isAssetListWithIntervention: boolean;

  public assetGroupsByType$: Observable<IAssetGroupByType[]>;

  public assetGroups$: Observable<IAssetGroupByType[]>;
  public assetTypeAndIdsToLogicLayers: { type: string; ids: string[]; logicLayer: string }[] = [];
  public opportunityNoticeAssetTypesSubject = new BehaviorSubject<string[]>([]);
  public opportunityNoticeAssetTypes$ = this.opportunityNoticeAssetTypesSubject.asObservable();

  public assetsInterventionIds: string[];
  public icons = {};
  public logicLayers = [];

  public isInitializing = false;
  public hoveredAssetIds: string[] = [];
  public typeId = '';

  constructor(
    private readonly opportunityNoticesCreateComponent: OpportunityNoticesCreateComponent,
    private readonly opportunityNoticeService: OpportunityNoticeService,
    private readonly mapHighlightService: MapHighlightService,
    private readonly assetService: AssetService,
    private readonly dialogsService: DialogsService,
    private readonly mapService: MapService,
    private readonly mapAssetLayerService: MapAssetLayerService,
    windowService: WindowService,
    activatedRoute: ActivatedRoute
  ) {
    super(windowService, activatedRoute);
  }

  public async ngOnInit(): Promise<void> {
    this.icons = this.opportunityNoticeService.getAssetIconsDictionary();
    this.initAssets();
    this.onOpportunityNoticeChanged();
    await this.initListMapObservable();
    this.initAssetsWithInterventions();
    this.updateMapAssets();
    this.assetGroupsByType$.subscribe(() => (this.isInitializing = false));
  }

  public async createGeoOpportunityNotice(assetGroupByType: IAssetGroupByType): Promise<void> {
    if (!this.opportunityNoticesCreateComponent.canCreateOpportunityNotice()) {
      return;
    }

    const modalRef = this.dialogsService.showModal(OpportunityNoticeModalComponent);
    modalRef.componentInstance.init(this.project, assetGroupByType, undefined);
    const res = await modalRef.result;
    if (!this.project.isOpportunityAnalysis && res === DecisionCreateCloseType.created) {
      await this.windowService.refresh();
    }
  }

  public async onAssetListHover(assets: IAsset[]): Promise<void> {
    await this.mapHighlightService.onAssetListHover(assets);
  }

  public async clearHighlight(): Promise<void> {
    await this.mapHighlightService.clearHighlight();
  }

  public getAssetIdsFromAssetGroup(assetGroupsByType: IAssetGroupByType): string[] {
    return assetGroupsByType.items.map(i => i.id);
  }

  public get assetGroupType(): string {
    return '';
  }

  private get opportunityNoticeAssetTypes(): string[] {
    return this.opportunityNoticeAssetTypesSubject.getValue();
  }

  private async initListMapObservable(): Promise<void> {
    await this.mapService.mapLoaded$.pipe(take(1)).toPromise();

    this.opportunityNoticesCreateComponent.map.popupService.hoveredFeatures$
      .pipe(takeUntil(this.destroy$))
      .subscribe(features => {
        this.hoveredAssetIds = [];
        const filteredFeatures = features.filter(feature => !feature.properties.project);
        filteredFeatures.forEach(async feature => {
          const assetTypeIdPair = await this.assetService.getAssetTypeAndIdFromAssetFeature(feature);
          this.hoveredAssetIds.push(assetTypeIdPair.assetId.toString());
        });
      });
  }

  private updateMapAssets(): void {
    this.assetGroups$
      .pipe(
        take(1),
        map((assetGroups: IAssetGroupByType[]) => {
          this.assetTypeAndIdsToLogicLayers = assetGroups.map(ag => ({
            type: ag.key,
            ids: ag.items.map(i => i.id),
            logicLayer: undefined
          }));
          const logicLayers = this.assetTypeAndIdsToLogicLayers.map(assetType =>
            this.mapAssetLayerService.getLogicLayerIdFromAssetType(assetType.type as AssetType)
          );
          return merge(...logicLayers);
        }),
        switchMap(logicLayers => logicLayers)
      )
      .subscribe(logicLayer => {
        this.logicLayers.push(logicLayer);

        if (this.assetTypeAndIdsToLogicLayers.length === this.logicLayers.length) {
          this.assetTypeAndIdsToLogicLayers = this.assetTypeAndIdsToLogicLayers.map((object, i) => ({
            ...object,
            logicLayer: this.logicLayers[i]
          }));
          this.assetTypeAndIdsToLogicLayers = this.mapService.groupAssetTypeIdsByLogicLayer(
            this.assetTypeAndIdsToLogicLayers
          );
          this.mapService.hideAllMapAssets();
          this.mapService.showProjectAssets(this.assetTypeAndIdsToLogicLayers);
        }
      });
  }
  private onOpportunityNoticeChanged(): void {
    this.opportunityNoticeService.opportunityNoticeChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe((opportunityNotice: IEnrichedOpportunityNotice) => {
        if (opportunityNotice.status === OpportunityNoticeStatus.closed || !opportunityNotice.assets.length) {
          return;
        }
        const typeId = opportunityNotice.assets[0].typeId;
        if (!this.opportunityNoticeAssetTypes.includes(typeId)) {
          this.opportunityNoticeAssetTypesSubject.next(concat(this.opportunityNoticeAssetTypes, typeId));
        }
      });
  }

  private initAssets(): void {
    this.isInitializing = true;

    this.assetGroups$ = this.windowService.project$.pipe(
      take(1),
      switchMap(project => from(this.fetchAssets(project, { geometry: project.geometry }))),
      map(assets => assets.groupBy(a => a.typeId)),
      tap((assetGroups: IAssetGroupByType[]) => assetGroups.forEach(ag => (ag.icon = this.icons[ag.key]))),
      shareReplay()
    );
    from(this.opportunityNoticeService.getOpportunityNoticesByProject(this.project.id, defaultFilter))
      .pipe(
        map(opportunityNotices =>
          opportunityNotices.items
            .filter(op => op.assets.length && op.status !== OpportunityNoticeStatus.closed)
            .map(op => op.assets[0].typeId)
        )
      )
      .subscribe(assetTypes => {
        this.opportunityNoticeAssetTypesSubject.next(assetTypes);
      });

    const assetTypes$ = this.assetService.getActiveAssets();

    this.assetGroupsByType$ = combineLatest(
      this.assetGroups$,
      assetTypes$,
      this.opportunityNoticeService.filtersChanged$.pipe(startWith(null)),
      this.opportunityNoticeAssetTypes$
    ).pipe(
      takeUntil(this.destroy$),
      map(([groups, assetTypes, filters, onAssetTypes]) => {
        const filter = cloneDeep(filters);
        const assetGroups = cloneDeep(groups);
        const readOnlyAssetTypes = remove(assetTypes, at => !!at.properties?.consultationOnly);
        assetGroups.forEach(ag => (ag.hasOpportunityNotice = onAssetTypes.includes(ag.key)));
        let filteredAssetGroups: IAssetGroupByType[] = filterLodash(assetGroups, ag => {
          const owners = ag.items.map(i => i.ownerId);
          const requestorFilter = filter.assetTypes?.length ? filter.assetTypes.includes(ag.key) : true;
          filter.requestors = Array.isArray(filter.requestors) ? filter.requestors : [filter.requestors];
          if (!filter.assetTypes.length) {
            filter.assetTypes = assetGroups.map(assetGroup => assetGroup.key);
          }
          const assetTypeFilter = filter.requestors?.length ? filter.requestors.some(r => owners.includes(r)) : true;
          return requestorFilter && assetTypeFilter;
        });
        const assetTypeCodes = assetTypes.map(at => at.code);
        remove(filteredAssetGroups, ag => readOnlyAssetTypes?.some(roat => roat.code === ag.key));
        remove(filteredAssetGroups, ag => !assetTypeCodes.includes(ag.key));
        filteredAssetGroups = filteredAssetGroups.map(el => {
          el.items = el.items.filter(x => x.id);
          return el;
        });
        return orderBy(filteredAssetGroups, a => assetTypes.find(at => at.code === a.key)?.label.fr);
      })
    );
  }

  private initAssetsWithInterventions(): void {
    const interventions = this.windowService.currentProject.interventions;
    this.assetGroupsByType$.pipe(takeUntil(this.destroy$)).subscribe(assetGroupsByType => {
      this.assetsInterventionIds = assetGroupsByType.map(
        assetGroupByType =>
          interventions.find(intervention => assetGroupByType.items.some(item => item.id === intervention.assets[0].id))
            ?.id
      );
    });
  }
}

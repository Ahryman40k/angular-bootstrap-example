import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  IAsset,
  IEnrichedOpportunityNotice,
  IEnrichedOpportunityNoticePaginated,
  IEnrichedProject,
  IPlainNote,
  IPlainOpportunityNotice,
  ISearchAssetsRequest,
  ProjectType
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, isNil } from 'lodash';
import { BehaviorSubject, Subject } from 'rxjs';
import { assetIconsWithoutLayerFilter } from 'src/app/map/panel/asset-layer/map-layer-manager-config';
import { environment } from 'src/environments/environment';

import { SortDirection } from '../forms/sort/sort.component';
import { buildHttpParams } from '../http/params-builder';
import { BroadcastEvent, WindowBroadcastService } from '../window/window-broadcast.service';
import { AssetService } from './asset.service';
import { GlobalLayerService } from './global-layer.service';

export const sortKeys = { assetType: 'assetTypeLabel', requestor: 'requestorLabel' };
export interface IOpportunityNoticeFilter {
  requestors: string[];
  assetTypes: string[];
}

@Injectable({
  providedIn: 'root'
})
export class OpportunityNoticeService {
  private readonly filtersChangedSubject = new BehaviorSubject<IOpportunityNoticeFilter>({
    requestors: [],
    assetTypes: []
  });
  public filtersChanged$ = this.filtersChangedSubject.asObservable();

  private readonly opportunityNoticeChangedSubject = new Subject<IEnrichedOpportunityNotice>();
  public opportunityNoticeChanged$ = this.opportunityNoticeChangedSubject.asObservable();

  public assets: IAsset[];

  constructor(
    private readonly http: HttpClient,
    private readonly assetService: AssetService,
    private readonly globalLayerService: GlobalLayerService,
    private readonly broadcastService: WindowBroadcastService
  ) {}

  public changeFilters(filterValue: IOpportunityNoticeFilter): void {
    this.filtersChangedSubject.next(filterValue);
  }

  public getFiltersValue(): IOpportunityNoticeFilter {
    return this.filtersChangedSubject.value;
  }

  public async updateOpportunityNotice(
    opportunityNoticeId: string,
    opportunityNotice: IPlainOpportunityNotice
  ): Promise<void> {
    const res = await this.http
      .put<IEnrichedOpportunityNotice>(
        `${environment.apis.planning.opportunityNotices}/${opportunityNoticeId}`,
        opportunityNotice
      )
      .toPromise();

    this.opportunityNoticeChangedSubject.next(res);
  }

  public async updateOpportunityNoticeNote(
    opportunityNoticeId: string,
    opportunityNoticeNoteId: string,
    opportunityNoticeNote: IPlainNote
  ): Promise<void> {
    const res = await this.http
      .put<IEnrichedOpportunityNotice>(
        `${environment.apis.planning.opportunityNotices}/${opportunityNoticeId}/notes/${opportunityNoticeNoteId}`,
        opportunityNoticeNote
      )
      .toPromise();

    this.opportunityNoticeChangedSubject.next(res);
  }

  public async createOpportunityNotice(opportunityNotice: IPlainOpportunityNotice): Promise<void> {
    const res = await this.http
      .post<IEnrichedOpportunityNotice>(`${environment.apis.planning.opportunityNotices}`, opportunityNotice)
      .toPromise();

    this.opportunityNoticeChangedSubject.next(res);
  }

  public async getOpportunityNoticesByProject(
    projectId: string,
    sortValue: { key: string; direction: SortDirection }
  ): Promise<IEnrichedOpportunityNoticePaginated> {
    const sortDirection = sortValue.direction === 'desc' ? '-' : '';
    const params = buildHttpParams({
      projectId,
      limit: environment.services.pagination.limitMax,
      offset: 0,
      orderBy: `${sortDirection}${sortValue.key}`
    });
    return this.http
      .get<IEnrichedOpportunityNoticePaginated>(`${environment.apis.planning.opportunityNotices}`, { params })
      .toPromise();
  }

  public getOpportunityNoticeById(id: string): Promise<IEnrichedOpportunityNotice> {
    return this.http
      .get<IEnrichedOpportunityNotice>(`${environment.apis.planning.opportunityNotices}/${id}`)
      .toPromise();
  }

  public async searchAssetsWithoutIntervention(
    project: IEnrichedProject,
    searchAssetParams: ISearchAssetsRequest
  ): Promise<IAsset[]> {
    const interventionsAssetIds = flatten(
      project.interventions.map(intervention => intervention.assets).filter(asset => !isNil(asset))
    ).map(asset => asset.id);
    if (!this.assets) {
      this.assets = await this.assetService.searchAssets(searchAssetParams);
    }
    return this.assets.filter(asset => !interventionsAssetIds.includes(asset.id));
  }

  public async searchAssetsWithIntervention(project: IEnrichedProject): Promise<IAsset[]> {
    return flatten(project.interventions.map(intervention => intervention.assets));
  }

  public getAssetIconsDictionary(): { [key: string]: string } {
    // create a dictionary of layerId: layerIconName properties from layer filter using asset type
    const layers = flatten(this.globalLayerService.getAllLayerSubGroups().map(subGroup => subGroup.layers));
    const iconsFromLayerFilter = Object.assign(
      {},
      ...layers.map(layer => ({ [layer.layerId]: layer.icon, [layer.layerId.slice(0, -1)]: layer.icon }))
    );
    return { ...iconsFromLayerFilter, ...assetIconsWithoutLayerFilter };
  }

  public async addNoteToOpportunityNotice(
    opportunityNoticeId: string,
    note: IPlainNote
  ): Promise<IEnrichedOpportunityNotice> {
    const url = `${environment.apis.planning.opportunityNotices}/${opportunityNoticeId}/notes`;
    return this.http.post<IEnrichedOpportunityNotice>(url, note).toPromise();
  }

  public canCreateOpportunityNotice(project: IEnrichedProject): boolean {
    return (
      (project.projectTypeId === ProjectType.integrated || project.projectTypeId === ProjectType.integratedgp) &&
      project.startYear >= new Date().getFullYear()
    );
  }
}

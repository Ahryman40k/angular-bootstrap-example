import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import {
  IAsset,
  ICountBy,
  IEnrichedIntervention,
  IEnrichedPaginatedInterventions,
  IGeometry,
  IInterventionCountBySearchRequest,
  IInterventionPaginatedSearchRequest,
  InterventionExpand,
  InterventionStatus,
  IPlainIntervention,
  IStringOrStringArray,
  ITaxonomy,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { Geometry } from 'geojson';
import { assign, clone, cloneDeep, findIndex, isEqual, pick } from 'lodash';
import { BehaviorSubject, merge, Observable, of } from 'rxjs';
import { map, pairwise, startWith } from 'rxjs/operators';
import { ObjectPinType } from 'src/app/map/config/layers/map-enums';
import { IInterventionPatch } from 'src/app/shared/models/interventions/intervention.model';

import { environment } from '../../../environments/environment';
import { ErrorService } from '../errors/error.service';
import { buildHttpParams } from '../http/params-builder';
import { bboxToHttpParam } from '../http/spatial';
import { IGlobalFilter, INTERVENTIONS_KEYS } from '../models/filters/global-filter';
import { GlobalFilterShownElement } from '../models/filters/global-filter-shown-element';
import { INTERVENTION_FIELDS } from '../models/findOptions/interventionFields';
import { InterventionType } from '../models/interventions/intervention-type';
import { NotificationsService } from '../notifications/notifications.service';
import { BroadcastEvent, BroadcastEventException, WindowBroadcastService } from '../window/window-broadcast.service';
import { GlobalFilterService } from './filters/global-filter.service';
import { ISearchObjectsRequest } from './search-objects.service';
import { SpatialAnalysisService } from './spatial-analysis.service';
import { TaxonomiesService } from './taxonomies.service';

const DUPLICATE_AREA_TOLERANCE_PERCENTAGE = 95;

@Injectable({
  providedIn: 'root'
})
export class InterventionService {
  public get filter(): IInterventionPaginatedSearchRequest {
    return this.filterSubject.value;
  }
  public set filter(filter: IInterventionPaginatedSearchRequest) {
    this.filterSubject.next(filter);
  }

  public get interventionsShown(): boolean {
    return this.interventionsShownSubject.value;
  }

  public set interventionsShown(v: boolean) {
    this.interventionsShownSubject.next(v);
  }
  public get interventionsReload(): boolean {
    return this.interventionsReloadSubject.value;
  }
  public set interventionsReload(v: boolean) {
    this.interventionsReloadSubject.next(v);
  }
  // enable edit PlanificationYear for those statuses
  public statusesToEditPlanificationYear: string[] = [InterventionStatus.refused, InterventionStatus.wished];
  private readonly filterSubject = new BehaviorSubject<IInterventionPaginatedSearchRequest>({});
  public readonly filter$ = this.filterSubject.asObservable();

  private readonly interventionsShownSubject = new BehaviorSubject<boolean>(true);
  public readonly interventionsShown$ = this.interventionsShownSubject.asObservable();

  public interventionChanged$: Observable<unknown>;
  private readonly interventionsReloadSubject = new BehaviorSubject<boolean>(true);
  public interventionsReload$ = this.interventionsReloadSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly spatialAnalysisService: SpatialAnalysisService,
    private readonly broadcastService: WindowBroadcastService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly notificationService: NotificationsService,
    private readonly errorService: ErrorService
  ) {
    this.interventionChanged$ = merge(
      broadcastService.observable(BroadcastEvent.interventionCreated),
      broadcastService.observable(BroadcastEvent.interventionUpdated),
      broadcastService.observable(BroadcastEvent.projectCreated),
      broadcastService.observable(BroadcastEvent.projectUpdated)
    );
    this.globalFilterService.filter$
      .pipe(startWith(null), pairwise())
      .subscribe(([previousFilter, currentFilter]) => this.onGlobalFilterChanges(previousFilter, currentFilter));
  }

  public getInterventionLink(intervention: IEnrichedIntervention): string {
    if (intervention?.project?.id) {
      return `window/projects/${intervention.project.id}/interventions/${intervention.id}/overview`;
    }
    return `window/interventions/${intervention.id}/overview`;
  }

  public patchFilter(value: IInterventionPaginatedSearchRequest): void {
    const filter = assign(cloneDeep(this.filter), value);
    this.filter = filter;
  }

  public getDefaultProgram(programs: ITaxonomy[]): ITaxonomy {
    if (!programs || !programs.length) {
      return null;
    }
    return programs.find(x => x.code === 'na');
  }

  public async getIntervention<T>(id: string, expand?: InterventionExpand[]): Promise<T> {
    const params = expand ? buildHttpParams({ expand }) : undefined;
    return this.http
      .get<T>(`${environment.apis.planning.interventions}/${id}`, { params })
      .toPromise();
  }

  public async createIntervention(
    plainIntervention: IPlainIntervention,
    broadcastException?: BroadcastEventException
  ): Promise<IEnrichedIntervention> {
    const borough = await this.spatialAnalysisService.getBorough(plainIntervention.interventionArea.geometry);
    if (!borough) {
      return undefined;
    }
    plainIntervention.boroughId = borough.id;
    const newIntervention = await this.http
      .post<IEnrichedIntervention>(environment.apis.planning.interventions, plainIntervention)
      .toPromise();
    if (
      broadcastException !== BroadcastEventException.opportunityNoticeResponseInterventionCreation &&
      broadcastException !== BroadcastEventException.interventionCreate
    ) {
      this.broadcastService.publish(BroadcastEvent.interventionCreated);
    }
    return newIntervention;
  }

  public async updateIntervention(
    plainIntervention: IPlainIntervention,
    broadcastException?: BroadcastEventException
  ): Promise<IEnrichedIntervention> {
    let updatedIntervention: IEnrichedIntervention;
    if (plainIntervention.interventionArea.isEdited) {
      const borough = await this.spatialAnalysisService.getBorough(plainIntervention.interventionArea.geometry);
      if (!borough) {
        return undefined;
      }
      plainIntervention.boroughId = borough.id;
    }

    try {
      updatedIntervention = await this.http
        .put<IEnrichedIntervention>(
          `${environment.apis.planning.interventions}/${plainIntervention.id}`,
          plainIntervention
        )
        .toPromise();
    } catch (error) {
      const errorsMsg = this.errorService.getServerMessages(error);
      errorsMsg.forEach(msg => this.notificationService.showError(msg));
    }

    if (broadcastException !== BroadcastEventException.interventionEdit) {
      this.broadcastService.publish(BroadcastEvent.interventionUpdated);
    }

    return updatedIntervention;
  }

  public async getCountByBorough(): Promise<ICountBy[]> {
    if (!this.interventionsShown) {
      return [];
    }
    const searchObj: IInterventionCountBySearchRequest = {
      ...this.filter,
      countBy: INTERVENTION_FIELDS.BOROUGH_ID,
      project: 'null'
    };
    return this.getCountBy(searchObj);
  }

  public async getCountBy(countByRequest?: IInterventionCountBySearchRequest): Promise<ICountBy[]> {
    return this.http.post<ICountBy[]>(`${environment.apis.planning.interventions}/countBy`, countByRequest).toPromise();
  }
  public async patchIntervention(intervention: IEnrichedIntervention, patch: IInterventionPatch): Promise<void> {
    const payload = Object.assign(clone(intervention), patch);
    await this.http
      .put<IPlainIntervention>(`${environment.apis.planning.interventions}/${intervention.id}`, payload)
      .toPromise();
    this.broadcastService.publish(BroadcastEvent.interventionUpdated);
  }

  public deleteIntervention(interventionId: string): Observable<void> {
    return this.http.delete<void>(`${environment.apis.planning.interventions}/${interventionId}`);
  }

  public removeIntervention(interventions: IEnrichedIntervention[], interventionId: string): IEnrichedIntervention[] {
    const index = findIndex(interventions, { id: interventionId });
    if (index !== -1) {
      interventions.splice(index, 1);
    }
    return interventions;
  }

  public getWorkArea(geometries: IGeometry[] | Geometry[]): Promise<turf.Feature> {
    return this.http.post<turf.Feature>(environment.apis.planning.search + '/work-area', geometries).toPromise();
  }

  public async getInterventions(
    tempSearchObj: IInterventionPaginatedSearchRequest = {}
  ): Promise<IEnrichedPaginatedInterventions> {
    if (!this.interventionsShownSubject.value) {
      return {};
    }
    const searchObj = { ...this.filter, ...tempSearchObj };
    const httpParams = searchObj ? buildHttpParams(searchObj) : undefined;
    const results = await this.http
      .get<IEnrichedPaginatedInterventions>(environment.apis.planning.interventions, { params: httpParams })
      .toPromise();
    return results;
  }

  public async getInterventionByIds(ids: string[]): Promise<IEnrichedIntervention[]> {
    const searchObj: IInterventionPaginatedSearchRequest = {
      id: ids.join(',')
    };
    const httpParams = searchObj ? buildHttpParams(searchObj) : undefined;
    const results = await this.http
      .get<IEnrichedPaginatedInterventions>(environment.apis.planning.interventions, { params: httpParams })
      .toPromise();
    return results.items;
  }

  public searchInterventions(searchObj: IInterventionPaginatedSearchRequest): Observable<IEnrichedIntervention[]> {
    if (!this.interventionsShownSubject.value) {
      return of([]);
    }
    const httpParams = searchObj ? buildHttpParams(searchObj) : undefined;
    return this.http
      .get<IEnrichedPaginatedInterventions>(environment.apis.planning.interventions, { params: httpParams })
      .pipe(map(x => x.items));
  }

  public searchPaginatedInterventions(
    searchRequest: IInterventionPaginatedSearchRequest
  ): Observable<IEnrichedPaginatedInterventions> {
    return this.http.post<IEnrichedPaginatedInterventions>(
      `${environment.apis.planning.interventions}/search`,
      searchRequest
    );
  }

  public searchInterventionsPost(searchObj: IInterventionPaginatedSearchRequest): Observable<IEnrichedIntervention[]> {
    return this.http
      .post<IEnrichedPaginatedInterventions>(`${environment.apis.planning.interventions}/search`, searchObj)
      .pipe(map(x => x.items));
  }
  /**
   * Gets area features for intervention and adds the intervention id as a property.
   * @param interventions
   * @returns area features
   */
  public getAreaFeatures(interventions: IEnrichedIntervention[]): turf.Feature[] {
    return interventions
      .filter(i => i.interventionArea.geometry)
      .map(x => {
        const f = turf.feature(x.interventionArea.geometry);
        f.properties = this.getInterventionFeatureProperties(x);
        return f;
      });
  }

  /**
   * Gets pin features for intervention and adds the intervention id as a property.
   * @param interventions
   * @returns pin features
   */
  public getInterventionPins(interventions: IEnrichedIntervention[]): turf.Feature[] {
    return interventions
      ?.filter(i => i.interventionArea.geometryPin)
      .map(x => {
        const f = turf.point(x.interventionArea.geometryPin);
        f.properties = this.getInterventionFeatureProperties(x);
        return f;
      });
  }

  public async getAssetLastIntervention(assetId: string, planificationYear: number): Promise<IEnrichedIntervention> {
    const searchObj = { assetId, toPlanificationYear: planificationYear, orderBy: '-planificationYear', limit: 1 };
    const result = await this.http
      .get<IEnrichedPaginatedInterventions>(environment.apis.planning.interventions, {
        params: buildHttpParams(searchObj)
      })
      .toPromise();
    return result.items[0];
  }

  private getInterventionPinType(intervention: IEnrichedIntervention): ObjectPinType {
    let interventonPinType;
    if (intervention.status === InterventionStatus.integrated || intervention.status === InterventionStatus.accepted) {
      interventonPinType = ObjectPinType.interventionAccepted;
    } else if (intervention.status === InterventionStatus.refused) {
      interventonPinType = ObjectPinType.interventionRefused;
    } else if (intervention.status === InterventionStatus.canceled) {
      interventonPinType = ObjectPinType.interventionCanceled;
    } else if (intervention.status === InterventionStatus.waiting && !intervention.decisionRequired) {
      interventonPinType = ObjectPinType.decisionNotRequiredWaitingIntervention;
    } else if (intervention.status === InterventionStatus.wished) {
      interventonPinType = ObjectPinType.decisionRequiredWishedIntervention;
    } else if (intervention.decisionRequired && intervention.status !== InterventionStatus.wished) {
      interventonPinType = ObjectPinType.decisionRequiredNotWishedIntervention;
    } else {
      interventonPinType = ObjectPinType.intervention;
    }
    return interventonPinType;
  }

  private getInterventionFeatureProperties(intervention: IEnrichedIntervention): any {
    return {
      _highlighted: true,
      id: intervention.id,
      intervention,
      decisionRequired: intervention.decisionRequired || false,
      type: this.getInterventionPinType(intervention)
    };
  }

  /**
   * Gets asset from interventions and converts it to features
   * @param interventions
   * @returns asset features
   */
  public getAssetFeatures(interventions: IPlainIntervention[]): turf.Feature[] {
    // TODO: "Assets"
    // - see APOC-5618 for more details
    return interventions.map(intervention => turf.feature(intervention.assets[0].geometry));
  }

  public isInterventionTypeOpportunity(intervention: IEnrichedIntervention): boolean {
    return intervention && intervention.interventionTypeId === InterventionType.opportunity;
  }

  /**
   * Validation for any interaction with an intervention
   * @param intervention
   */
  public canInteract(intervention: IEnrichedIntervention): boolean {
    return ![InterventionStatus.canceled].includes(intervention.status as InterventionStatus);
  }

  public getGeolocatedDuplicate(
    interventionId: string,
    assetId: IStringOrStringArray,
    requestorId: string,
    planificationYear: number
  ): Observable<IEnrichedIntervention> {
    return this.getDuplicate(
      {
        assetId,
        requestorId: [requestorId],
        planificationYear
      },
      i => this.isGeolocatedDuplicate(i, interventionId, assetId, requestorId, planificationYear)
    );
  }

  public getNonGeolocatedDuplicate(
    interventionId: string,
    interventionArea: IGeometry,
    assetTypeId: string,
    requestorId: string,
    planificationYear: number
  ): Observable<IEnrichedIntervention> {
    return this.getDuplicate(
      {
        assetTypeId: [assetTypeId],
        requestorId: [requestorId],
        planificationYear,
        interventionAreaBbox: bboxToHttpParam(turf.bbox(interventionArea))
      },
      i =>
        this.isNonGeolocatedDuplicate(i, interventionId, interventionArea, assetTypeId, requestorId, planificationYear)
    );
  }

  private getDuplicate(
    searchRequest: IInterventionPaginatedSearchRequest,
    isDuplicate: (intervention: IEnrichedIntervention) => boolean
  ): Observable<IEnrichedIntervention> {
    return this.searchInterventions(searchRequest).pipe(
      map(interventions => {
        if (!interventions || !interventions.length) {
          return null;
        }
        return interventions.find(x => isDuplicate(x));
      })
    );
  }

  public isGeolocatedDuplicate(
    intervention: IEnrichedIntervention,
    interventionId: string,
    assetId: IStringOrStringArray,
    requestorId: string,
    planificationYear: number
  ): boolean {
    let isAssetsIncluded: boolean;
    if (Array.isArray(assetId)) {
      isAssetsIncluded = assetId.every(id => intervention.assets.find(asset => asset.id === id));
    } else {
      isAssetsIncluded = !!intervention.assets.find(asset => asset.id === assetId);
    }
    return (
      intervention.id !== interventionId &&
      isAssetsIncluded &&
      intervention.requestorId === requestorId &&
      intervention.planificationYear === +planificationYear
    );
  }

  public isNonGeolocatedDuplicate(
    intervention: IEnrichedIntervention,
    interventionId: string,
    interventionArea: IGeometry,
    assetTypeId: string,
    requestorId: string,
    planificationYear: number
  ): boolean {
    return (
      intervention.id !== interventionId &&
      // TODO: "Assets"
      // - see APOC-5620 for more details
      intervention.assets[0].typeId === assetTypeId &&
      intervention.requestorId === requestorId &&
      intervention.planificationYear === +planificationYear &&
      this.spatialAnalysisService.intersectionAreaPercentage(
        interventionArea,
        intervention.interventionArea.geometry
      )[0] > DUPLICATE_AREA_TOLERANCE_PERCENTAGE
    );
  }

  public getInterventionColor(value: IEnrichedIntervention): string {
    if (!value) {
      return '';
    }
    return value.decisionRequired ? 'intervention-decision-required' : 'intervention';
  }

  /**
   * Generates the intervention name.
   * workType / assetType / interventionWorkAreaSuggestedStreetName
   * @param asset The asset
   */
  public async generateInterventionName(
    assetWorkTypeId: string,
    assetTypeId: string,
    interventionWorkAreaSuggestedStreetName?: string
  ): Promise<string> {
    const assetType = await this.taxonomiesService.translateAsync(TaxonomyGroup.assetType, assetTypeId);
    const workType = await this.taxonomiesService.translateAsync(TaxonomyGroup.workType, assetWorkTypeId);
    return [workType, assetType, interventionWorkAreaSuggestedStreetName].joinStrings(' / ');
  }

  public getInterventionProgram(intervention: IEnrichedIntervention): Observable<string> {
    const programId = intervention.programId;
    if (!programId) {
      return undefined;
    }

    return this.taxonomiesService
      .code(TaxonomyGroup.programType, intervention.programId)
      .pipe(map(programType => programType.properties?.acronym?.fr || programType.label.fr));
  }

  private onGlobalFilterChanges(previousFilter: IGlobalFilter, currentFilter: IGlobalFilter): void {
    this.interventionsShown = this.globalFilterService.isElementShown(GlobalFilterShownElement.interventions);
    this.interventionsReload =
      this.interventionsShown &&
      this.globalFilterService.hasFilterChanged(previousFilter, currentFilter, INTERVENTIONS_KEYS, [
        GlobalFilterShownElement.interventions
      ]);
    if (this.interventionsReload) {
      this.patchFilter({
        boroughId: currentFilter.boroughs,
        executorId: currentFilter.executors,
        fromEstimate: currentFilter.budgetFrom,
        interventionTypeId: currentFilter.interventionTypes,
        medalId: currentFilter.medals,
        programBookId: currentFilter.programBooks,
        programId: currentFilter.programTypes,
        requestorId: currentFilter.requestors,
        status: currentFilter.interventionStatuses,
        decisionTypeId: currentFilter.decisionTypeId,
        toEstimate: currentFilter.budgetTo,
        workTypeId: currentFilter.workTypes,
        decisionRequired: currentFilter.decisionRequired
      });
    }
  }

  public createInterventionLink(asset?: IAsset): string {
    if (asset) {
      return `window/interventions/create/${asset.typeId}/${asset.id}`;
    }
    return 'window/interventions/create';
  }
}

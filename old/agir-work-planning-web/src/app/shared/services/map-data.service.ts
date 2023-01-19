import { Injectable, OnDestroy } from '@angular/core';
import * as turf from '@turf/turf';
import {
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionPaginatedSearchRequest,
  IProjectPaginatedSearchRequest,
  IProjectSearchRequest,
  IRtuProject,
  ITaxonomy,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, get, isEmpty, isEqual } from 'lodash';
import {
  BehaviorSubject,
  combineLatest,
  forkJoin,
  merge,
  MonoTypeOperatorFunction,
  Observable,
  of,
  Subject
} from 'rxjs';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  shareReplay,
  startWith,
  switchMap,
  take,
  takeUntil
} from 'rxjs/operators';
import { environment } from 'src/environments/environment';

import { mapStyleConfig } from '../../map/config/layers/styles';
import { bboxToHttpParam } from '../http/spatial';
import { BoroughCountFeature } from '../models/borough/borough-count-feature';
import { CityCountFeature } from '../models/city/city-count-feature';
import { IRtuProjectCriteria } from '../models/rtu-project-criteria';
import { BoroughService } from './borough.service';
import { ComparisonService } from './comparison.service';
import { InterventionService } from './intervention.service';
import { MapService } from './map.service';
import { ProjectService } from './project.service';
import { RtuProjectService } from './rtu-project.service';
import { TaxonomiesService } from './taxonomies.service';

const MAP_DATA_FETCH_DEBOUNCE = 200;
const MIN_VIEWPORT_DISTANCE = 1;
const MAP_DATA_LOAD_ZOOM_THRESHOLD = 0.05;

type ViewportZoomValue = [turf.BBox, number];

type InterventionSearchCombinedDependencies = [
  ViewportZoomValue,
  IInterventionPaginatedSearchRequest,
  unknown,
  boolean,
  boolean,
  boolean
];

type CountBoroughCombinedDependencies = [
  ViewportZoomValue,
  IProjectSearchRequest,
  boolean,
  IInterventionPaginatedSearchRequest,
  boolean
];

type CountCityCombinedDependencies = [ViewportZoomValue, IRtuProjectCriteria, ITaxonomy[]];

type ProjectSearchCombinedDependencies = [
  ViewportZoomValue,
  IProjectPaginatedSearchRequest,
  unknown,
  boolean,
  boolean,
  boolean
];
type RtuProjectSearchCombinedDependencies = [
  ViewportZoomValue,
  IRtuProjectCriteria,
  boolean,
  boolean,
  boolean,
  boolean
];

interface IViewPortAndZoom {
  viewport: turf.BBox;
  zoom: number;
}

interface IInterventionSearchDependencies {
  originalRequest: IInterventionPaginatedSearchRequest;
  viewportZoom: IViewPortAndZoom;
  interventionsShown: boolean;
  interventionsReload: boolean;
  criteriaValuesChanged: boolean;
}

interface ICountBoroughDependencies {
  viewportZoom: IViewPortAndZoom;
  projectsFilter: IProjectSearchRequest;
  projectsShown: boolean;
  interventionsFilter: IInterventionPaginatedSearchRequest;
  interventionsShown: boolean;
}

interface ICountCityDependencies {
  viewportZoom: IViewPortAndZoom;
  rtuProjectCriteria: IRtuProjectCriteria;
  taxonomies: ITaxonomy[];
}

interface IProjectSearchDependencies {
  originalRequest: IProjectPaginatedSearchRequest;
  viewportZoom: IViewPortAndZoom;
  projectsShown: boolean;
  projectsReload: boolean;
  criteriaValuesChanged: boolean;
}

interface IRtuProjectSearchDependencies {
  originalRequest: IRtuProjectCriteria;
  viewportZoom: IViewPortAndZoom;
  partnerProjectsShown: boolean;
  linkedCityProjectsShown: boolean;
  boroughProjectsShown: boolean;
  rtuProjectsReload: boolean;
}

export interface IRtuProjectDateCriterias {
  fromDateEnd?: string;
  toDateStart?: string;
}

@Injectable({ providedIn: 'root' })
export class MapDataService implements OnDestroy {
  private lastRefreshSubject = new BehaviorSubject<Date>(null);
  public readonly lastRefresh$ = this.lastRefreshSubject.asObservable();
  private isMapLoadingSubject = new BehaviorSubject<boolean>(false);
  public readonly isMapLoading$ = this.isMapLoadingSubject.asObservable();

  private _projectsDisabled: boolean;
  public get projectsDisabled(): boolean {
    return this._projectsDisabled;
  }
  public set projectsDisabled(v: boolean) {
    this._projectsDisabled = v;
    if (!v) {
      this.setDefaultProjects();
    } else {
      this.setEmpty();
    }
  }

  private _rtuProjectsDisabled: boolean;
  public get rtuProjectsDisabled(): boolean {
    return this._rtuProjectsDisabled;
  }
  public set rtuProjectsDisabled(v: boolean) {
    this._rtuProjectsDisabled = v;
    if (!v) {
      this.setDefaultRtuProjects();
    } else {
      this.setEmpty();
    }
  }

  private _interventionsDisabled: boolean;
  public get interventionsDisabled(): boolean {
    return this._interventionsDisabled;
  }
  public set interventionsDisabled(v: boolean) {
    this._interventionsDisabled = v;
    if (!v) {
      this.setDefaultInterventions();
    } else {
      this.setEmpty();
    }
  }

  private _countByBoroughDisabled: boolean;
  public get countByBoroughDisabled(): boolean {
    return this._countByBoroughDisabled;
  }
  public set countByBoroughDisabled(v: boolean) {
    this._countByBoroughDisabled = v;
    if (!v) {
      this.setDefaultCountByBorough();
    } else {
      this.setEmpty();
    }
  }

  private _countByCityDisabled: boolean;
  public get countByCityDisabled(): boolean {
    return this._countByCityDisabled;
  }
  public set countByCityDisabled(v: boolean) {
    this._countByCityDisabled = v;
    if (!v) {
      this.setDefaultCountByCity();
    } else {
      this.setEmpty();
    }
  }

  private readonly destroySubject = new Subject();
  private readonly destroy$ = this.destroySubject.asObservable();

  private readonly interventionsChangedSubject = new Subject();
  private readonly projectsChangedSubject = new Subject();
  private readonly rtuProjectsChangedSubject = new Subject();
  private readonly boroughCountChangedSubject = new Subject();
  private readonly cityCountChangedSubject = new Subject();
  private readonly assetsChangedSubject = new Subject();

  private readonly interventionsBehaviorSubject = new BehaviorSubject<IEnrichedIntervention[]>([]);
  public readonly interventions$ = this.interventionsBehaviorSubject.asObservable();
  private readonly projectsBehaviorSubject = new BehaviorSubject<IEnrichedProject[]>([]);
  public readonly projects$ = this.projectsBehaviorSubject.asObservable();
  private readonly rtuProjectsBehaviorSubject = new BehaviorSubject<IRtuProject[]>([]);
  public readonly rtuProjects$ = this.rtuProjectsBehaviorSubject.asObservable();
  private readonly boroughCountsBehaviorSubject = new BehaviorSubject<BoroughCountFeature[]>([]);
  public readonly boroughCounts$ = this.boroughCountsBehaviorSubject.asObservable();
  private readonly cityCountsBehaviorSubject = new BehaviorSubject<CityCountFeature[]>([]);
  public readonly cityCounts$ = this.cityCountsBehaviorSubject.asObservable();
  private readonly assetsBehaviorSubject = new BehaviorSubject<IAsset[]>([]);
  public readonly assets$ = this.assetsBehaviorSubject.asObservable();

  constructor(
    private readonly mapService: MapService,
    private readonly interventionsService: InterventionService,
    private readonly comparisonService: ComparisonService,
    private readonly projectService: ProjectService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly boroughService: BoroughService,
    private readonly taxonomiesService: TaxonomiesService
  ) {}

  public ngOnDestroy(): void {
    this.destroySubject.next();
  }

  public setDefault(): void {
    this.setDefaultInterventions();
    this.setDefaultProjects();
    this.setDefaultRtuProjects();
    this.setDefaultCountByBorough();
    this.setDefaultCountByCity();
  }

  public setEmpty(): void {
    this.setInterventions(of([]));
    this.setProjects(of([]));
    this.setRtuProjects(of([]));
    this.setCountByBorough(of([]));
    this.setAssets(of([]));
  }

  public setDefaultInterventions(): void {
    this.setInterventions(this.createInterventionsObservable());
  }

  public setDefaultProjects(): void {
    this.setProjects(this.createProjectsObservable());
  }

  public setDefaultRtuProjects(): void {
    if (!this.rtuProjectService.canReadRtuProjects) {
      return;
    }
    this.setRtuProjects(this.createRtuProjectsObservable());
  }

  public setDefaultCountByBorough(): void {
    this.setCountByBorough(this.createBoroughCountObservable());
  }

  public setDefaultCountByCity(): void {
    this.setCountByCity(this.createCityCountObservable());
  }

  public get canRefresh() {
    return (
      (this.shouldLoadProjects(this.mapService.zoom) && this.projectService.projectsShown) ||
      (this.shouldLoadInterventions(this.mapService.zoom) && this.interventionsService.interventionsShown)
    );
  }

  public setLastRefresh() {
    this.lastRefreshSubject.next(new Date());
  }

  public refresh() {
    this.isMapLoadingSubject.next(true);
    forkJoin([this.refreshInterventions(), this.refreshProjects()])
      .pipe(
        take(1),
        finalize(() => this.isMapLoadingSubject.next(false))
      )
      .subscribe(([interventions, projects]) => {
        this.interventionsBehaviorSubject.next(interventions);
        this.projectsBehaviorSubject.next(projects);
        this.setLastRefresh();
      });
  }

  public refreshInterventions(): Observable<IEnrichedIntervention[]> {
    if (this.interventionsService.interventionsShown) {
      const sr = this.createInterventionSearchRequest(this.mapService.viewport, this.interventionsService.filter);
      return this.interventionsService.searchInterventions(sr);
    }
    return of([]);
  }
  public deleteInterventions(...ids: string[]) {
    const interventions = this.interventionsBehaviorSubject.getValue().filter(i => !ids.includes(i.id));
    this.interventionsBehaviorSubject.next(interventions);
  }

  public refreshProjects(): Observable<IEnrichedProject[]> {
    const searchDependancies: IProjectSearchDependencies = {
      viewportZoom: this.getViewportAndZoom(this.getStartViewportZoom()),
      originalRequest: this.projectService.filter,
      criteriaValuesChanged: false,
      projectsReload: null,
      projectsShown: null
    };
    if (this.projectService.projectsShown) {
      const sr = this.createProjectSearchRequest(searchDependancies);
      return this.expandInterventions(sr);
    }
    return of([]);
  }

  public setInterventions(interventions$: Observable<IEnrichedIntervention[]>): void {
    this.interventionsChangedSubject.next();
    interventions$.subscribe(interventions => {
      this.interventionsBehaviorSubject.next(interventions);
    });
  }

  public setProjects(projects$: Observable<IEnrichedProject[]>): void {
    this.projectsChangedSubject.next();
    projects$.subscribe(projects => {
      this.projectsBehaviorSubject.next(projects);
    });
  }

  public setRtuProjects(rtuProjects$: Observable<IRtuProject[]>): void {
    this.rtuProjectsChangedSubject.next();
    rtuProjects$.subscribe(projects => {
      this.rtuProjectsBehaviorSubject.next(projects);
    });
  }

  public setAssets(assets$: Observable<IAsset[]>): void {
    this.assetsChangedSubject.next();
    assets$.subscribe(assets => {
      this.assetsBehaviorSubject.next(assets);
    });
  }

  public setCountByBorough(boroughCounts$: Observable<BoroughCountFeature[]>): void {
    this.boroughCountChangedSubject.next();
    boroughCounts$.subscribe(boroughCounts => {
      this.boroughCountsBehaviorSubject.next(boroughCounts);
    });
  }

  public setCountByCity(cityCounts$: Observable<CityCountFeature[]>): void {
    this.cityCountChangedSubject.next();
    cityCounts$.subscribe(cityCounts => {
      this.cityCountsBehaviorSubject.next(cityCounts);
    });
  }

  private createInterventionsObservable(): Observable<IEnrichedIntervention[]> {
    let lastViewPortZoom: IViewPortAndZoom;
    const setCurrentZoomAndViewPortValue = viewPortZoom => (lastViewPortZoom = viewPortZoom);

    return this.createMapLoadedObservable(this.interventionsChangedSubject).pipe(
      switchMap(() =>
        combineLatest(
          this.createViewportZoomObservable(this.interventionsChangedSubject),
          this.interventionsService.filter$,
          this.interventionsService.interventionChanged$.pipe(startWith(null)),
          this.interventionsService.interventionsShown$,
          this.interventionsService.interventionsReload$,
          this.comparisonService.criteriaValuesChanged$
        ).pipe(
          this.createTakeUntil(this.interventionsChangedSubject),
          filter(([[viewport, zoom]]) => this.shouldLoadInterventions(zoom)),
          debounceTime(MAP_DATA_FETCH_DEBOUNCE),
          map(d => this.createInterventionsDependencies(d)),
          distinctUntilChanged((prev, curr) => !this.interventionDependanciesSearchChanged(prev, curr)),
          switchMap(d => {
            if (!d.interventionsShown) {
              return of([]);
            }
            setCurrentZoomAndViewPortValue(d.viewportZoom);
            const sr = this.createInterventionSearchRequest(d.viewportZoom.viewport, d.originalRequest);
            return this.interventionsService.searchInterventions(sr);
          }),
          shareReplay(),
          this.createTakeUntil(this.interventionsChangedSubject)
        )
      )
    );
  }

  private createProjectsObservable(): Observable<IEnrichedProject[]> {
    let isLoadingPins = false;
    const startCombined = this.getStartProjectSearchCombinedDependencies();
    const viewportZoomChangedCondition = ([, zoom]) => !isLoadingPins || this.shouldLoadProjects(zoom);

    return this.createMapLoadedObservable(this.projectsChangedSubject).pipe(
      switchMap(() =>
        combineLatest(
          this.createViewportZoomObservable(this.projectsChangedSubject, viewportZoomChangedCondition),
          this.projectService.filter$,
          this.projectService.projectChanged$.pipe(startWith(null)),
          this.projectService.projectsShown$,
          this.projectService.projectsReload$,
          this.comparisonService.criteriaValuesChanged$
        ).pipe(
          this.createTakeUntil(this.projectsChangedSubject),
          startWith(startCombined),
          filter(([[, zoom]]) => this.shouldLoadProjects(zoom)),
          debounceTime(MAP_DATA_FETCH_DEBOUNCE),
          map(d => this.createProjectsDependencies(d)),
          distinctUntilChanged((prev, curr) => !this.projectDependanciesSearchChanged(prev, curr)),
          switchMap(d => {
            if (!d.projectsShown) {
              return of([]);
            }
            isLoadingPins = !this.shouldLoadProjectArea(d.viewportZoom.zoom);
            const sr = this.createProjectSearchRequest(d);
            return this.expandInterventions(sr);
          }),
          shareReplay(),
          this.createTakeUntil(this.projectsChangedSubject)
        )
      )
    );
  }

  private expandInterventions(sr: IProjectPaginatedSearchRequest): Observable<IEnrichedProject[]> {
    return this.projectService.searchProjects(sr).pipe(
      switchMap(prs => {
        if (!this.comparisonService.haveCriteriaValue) {
          return forkJoin([of([]), of(prs.items)]);
        }
        const interventionsIds = [];
        prs.items
          .filter(el => el.projectTypeId === ProjectType.nonIntegrated)
          .forEach(pr => {
            if (pr.interventionIds.length > 0) {
              interventionsIds.push(pr.interventionIds[0]);
            }
          });
        const searchRequest: IInterventionPaginatedSearchRequest = {
          id: interventionsIds,
          fields: ['workTypeId', 'programId', 'requestorId']
        };
        return forkJoin([this.interventionsService.searchInterventionsPost(searchRequest), of(prs.items)]);
      }),
      map(([interventions, projects]) => {
        this.comparisonService.setInterventions(interventions);
        return projects;
      })
    );
  }

  private createRtuProjectsObservable(): Observable<IRtuProject[]> {
    let isLoadingPins = false;
    const viewportZoomChangedCondition = ([, zoom]) => !isLoadingPins || this.shouldLoadProjects(zoom);

    return this.createMapLoadedObservable(this.rtuProjectsChangedSubject).pipe(
      switchMap(() =>
        combineLatest(
          this.createViewportZoomObservable(this.rtuProjectsChangedSubject, viewportZoomChangedCondition),
          this.rtuProjectService.rtuFilter$,
          this.rtuProjectService.partnerProjectsShown$,
          this.rtuProjectService.linkedCityProjectsShown$,
          this.rtuProjectService.boroughProjects$,
          this.rtuProjectService.rtuProjectsReload$
        ).pipe(
          this.createTakeUntil(this.rtuProjectsChangedSubject),
          filter(([[, zoom]]) => this.shouldLoadProjects(zoom)),
          debounceTime(MAP_DATA_FETCH_DEBOUNCE),
          map(d => this.createRtuProjectsDependencies(d)),
          distinctUntilChanged((prev, curr) => !this.projectRtuDependanciesSearchChanged(prev, curr)),
          switchMap(d => {
            if (!d.partnerProjectsShown && !d.boroughProjectsShown && !d.linkedCityProjectsShown) {
              return of([]);
            }
            isLoadingPins = !this.shouldLoadProjectArea(d.viewportZoom.zoom);
            const sr = this.createRtuProjectSearchRequest(d);
            return this.rtuProjectService.getRtuProjects(sr).pipe(map(x => x.items));
          })
        )
      )
    );
  }

  private createBoroughCountObservable(): Observable<BoroughCountFeature[]> {
    return this.createMapLoadedObservable(this.boroughCountChangedSubject).pipe(
      switchMap(() =>
        combineLatest(
          this.createViewportZoomObservable(this.boroughCountChangedSubject),
          this.projectService.filter$,
          this.projectService.projectsShown$,
          this.interventionsService.filter$,
          this.interventionsService.interventionsShown$
        ).pipe(
          this.createTakeUntil(this.boroughCountChangedSubject),
          debounceTime(MAP_DATA_FETCH_DEBOUNCE),
          map(el => this.createCountBoroughDependencies(el)),
          distinctUntilChanged((prev, curr) => !this.isCountBoroughDependenciesChanged(prev, curr)),
          filter(dependencies => {
            return (
              !this.shouldLoadProjects(dependencies.viewportZoom.zoom) ||
              !this.shouldLoadInterventions(dependencies.viewportZoom.zoom)
            );
          }),
          switchMap(() => {
            return this.boroughService.getCountByBoroughFeatures();
          }),
          shareReplay(),
          this.createTakeUntil(this.boroughCountChangedSubject)
        )
      )
    );
  }

  private createCityCountObservable(): Observable<CityCountFeature[]> {
    return this.createMapLoadedObservable(this.cityCountChangedSubject).pipe(
      switchMap(() =>
        combineLatest(
          this.createViewportZoomObservable(this.boroughCountChangedSubject),
          this.rtuProjectService.rtuFilter$,
          this.taxonomiesService.group(TaxonomyGroup.infoRtuPartner).pipe(takeUntil(this.destroy$))
        ).pipe(
          this.createTakeUntil(this.cityCountChangedSubject),
          debounceTime(MAP_DATA_FETCH_DEBOUNCE),
          map(el => this.createCountCityDependencies(el)),
          distinctUntilChanged((prev, curr) => !this.isCountCityDependenciesChanged(prev, curr)),
          filter(dependencies => !this.shouldLoadProjects(dependencies.viewportZoom.zoom)),
          switchMap(dependencies => {
            const rtuPartnerIdsByCategory = this.rtuProjectService.getPartnerIdsByCategory(dependencies?.taxonomies);
            return this.boroughService.getCountByCityFeatures(rtuPartnerIdsByCategory?.city || []);
          }),
          takeUntil(this.destroy$)
        )
      )
    );
  }

  private createMapLoadedObservable(specificSubject: Subject<any>): Observable<unknown> {
    return this.mapService.mapLoaded$.pipe(this.createTakeUntil(specificSubject));
  }

  private createViewportZoomObservable(
    specificSubject: Subject<any>,
    filterFunc?: (viewportZoom: ViewportZoomValue) => boolean
  ): Observable<ViewportZoomValue> {
    return this.createMapLoadedObservable(specificSubject).pipe(
      switchMap(() =>
        combineLatest(this.mapService.viewport$, this.mapService.zoom$).pipe(
          this.createTakeUntil(specificSubject),
          startWith(this.getStartViewportZoom()),
          filter(viewportZoom => (filterFunc ? filterFunc(viewportZoom) : true))
        )
      )
    );
  }

  private getViewportAndZoom(value: ViewportZoomValue): IViewPortAndZoom {
    return value
      ? {
          viewport: value[0],
          zoom: value[1]
        }
      : undefined;
  }

  private projectDependanciesSearchChanged(
    prev: IProjectSearchDependencies,
    curr: IProjectSearchDependencies
  ): boolean {
    if (!prev) {
      return true;
    }
    const oldValue: IProjectSearchDependencies = { ...prev, viewportZoom: null, projectsReload: null };
    const newValue: IProjectSearchDependencies = { ...curr, viewportZoom: null, projectsReload: null };
    return !isEqual(oldValue, newValue) || this.hasViewPortAndZoomChanged(curr.viewportZoom, prev.viewportZoom);
  }

  private projectRtuDependanciesSearchChanged(
    prev: IRtuProjectSearchDependencies,
    curr: IRtuProjectSearchDependencies
  ): boolean {
    if (!prev) {
      return true;
    }
    const oldValue: IRtuProjectSearchDependencies = { ...prev, viewportZoom: null, rtuProjectsReload: null };
    const newValue: IRtuProjectSearchDependencies = { ...curr, viewportZoom: null, rtuProjectsReload: null };
    return !isEqual(oldValue, newValue) || this.hasViewPortAndZoomChanged(curr.viewportZoom, prev.viewportZoom);
  }

  private interventionDependanciesSearchChanged(
    prev: IInterventionSearchDependencies,
    curr: IInterventionSearchDependencies
  ): boolean {
    if (!prev) {
      return true;
    }
    const oldValue: IInterventionSearchDependencies = { ...prev, viewportZoom: null, interventionsReload: null };
    const newValue: IInterventionSearchDependencies = { ...curr, viewportZoom: null, interventionsReload: null };
    return !isEqual(oldValue, newValue) || this.hasViewPortAndZoomChanged(curr.viewportZoom, prev.viewportZoom);
  }

  private createInterventionsDependencies(
    combinedDependencies: InterventionSearchCombinedDependencies
  ): IInterventionSearchDependencies {
    const [
      viewportZoom,
      originalRequest,
      interventionChanged,
      interventionsShown,
      interventionsReload,
      criteriaValuesChanged
    ] = combinedDependencies;
    return cloneDeep({
      originalRequest,
      viewportZoom: this.getViewportAndZoom(viewportZoom),
      interventionChanged,
      interventionsShown,
      interventionsReload,
      criteriaValuesChanged
    });
  }

  private createProjectsDependencies(
    combinedDependencies: ProjectSearchCombinedDependencies
  ): IProjectSearchDependencies {
    const [
      viewportZoom,
      originalRequest,
      projectChanged,
      projectsShown,
      projectsReload,
      criteriaValuesChanged
    ] = combinedDependencies;
    return cloneDeep({
      originalRequest,
      viewportZoom: this.getViewportAndZoom(viewportZoom),
      projectsShown,
      projectsReload,
      criteriaValuesChanged
    });
  }

  private createRtuProjectsDependencies(
    dependencies: RtuProjectSearchCombinedDependencies
  ): IRtuProjectSearchDependencies {
    const [
      viewportZoom,
      originalRequest,
      partnerProjectsShown,
      linkedCityProjectsShown,
      boroughProjectsShown,
      rtuProjectsReload
    ] = dependencies;
    return cloneDeep({
      originalRequest,
      viewportZoom: this.getViewportAndZoom(viewportZoom),
      partnerProjectsShown,
      linkedCityProjectsShown,
      boroughProjectsShown,
      rtuProjectsReload
    });
  }

  private createInterventionSearchRequest(
    viewport: turf.BBox,
    originalInterventionSearch: IInterventionPaginatedSearchRequest
  ): IInterventionPaginatedSearchRequest {
    const searchRequest: IInterventionPaginatedSearchRequest = cloneDeep(originalInterventionSearch || {});
    searchRequest.interventionAreaBbox = bboxToHttpParam(viewport);
    searchRequest.project = 'null';
    searchRequest.limit = environment.services.pagination.limitMax;
    searchRequest.fields = ['interventionArea', 'decisionRequired', 'status'].concat(
      this.comparisonService.interventionFields
    );
    return searchRequest;
  }

  private createProjectSearchRequest(dependencies: IProjectSearchDependencies): IProjectPaginatedSearchRequest {
    const searchRequest = cloneDeep(dependencies.originalRequest || {});
    searchRequest.bbox = bboxToHttpParam(dependencies.viewportZoom.viewport);
    searchRequest.limit = environment.services.pagination.limitMax;
    searchRequest.fields = ['startYear', 'endYear', 'geometryPin', 'projectTypeId', 'status'].concat(
      this.comparisonService.projectFields
    );
    if (this.shouldLoadProjectArea(dependencies.viewportZoom.zoom)) {
      searchRequest.fields.push('geometry');
    }
    return searchRequest;
  }

  private createRtuProjectSearchRequest(dependencies: IRtuProjectSearchDependencies): IRtuProjectCriteria {
    const searchRequest = {} as IRtuProjectCriteria;
    searchRequest.bbox = bboxToHttpParam(dependencies.viewportZoom.viewport);

    searchRequest.fields = ['geometryPin', 'dateStart', 'dateEnd'];

    if (this.shouldLoadProjectArea(dependencies.viewportZoom.zoom)) {
      searchRequest.fields.push('geometry');
    }
    searchRequest.limit = environment.services.pagination.limitMax;
    return { ...searchRequest, ...dependencies.originalRequest };
  }

  private getStartViewportZoom(): ViewportZoomValue {
    return [this.mapService.viewport, this.mapService.zoom];
  }

  private getStartProjectSearchCombinedDependencies(): ProjectSearchCombinedDependencies {
    return [
      this.getStartViewportZoom(),
      this.projectService.filter,
      undefined,
      this.projectService.projectsShown,
      this.projectService.projectsReload,
      this.comparisonService.haveCriteriaValue
    ];
  }

  private shouldLoadProjectArea(zoom: number): boolean {
    return zoom >= mapStyleConfig.projectArea.minZoom - 1;
  }

  private shouldLoadProjects(zoom: number): boolean {
    return this.shouldLoadByZoomValue(zoom, `projectPins.minZoom`);
  }

  private shouldLoadInterventions(zoom: number): boolean {
    return this.shouldLoadByZoomValue(zoom, `intervention.pins.zoom`);
  }

  private shouldLoadByZoomValue(zoom: number, key: string): boolean {
    return zoom >= get(mapStyleConfig, key) - MAP_DATA_LOAD_ZOOM_THRESHOLD;
  }

  private createTakeUntil<T>(specificSubject: Subject<any>): MonoTypeOperatorFunction<T> {
    return takeUntil(merge(this.destroy$, specificSubject));
  }

  private hasViewPortAndZoomChanged(previous: IViewPortAndZoom, current: IViewPortAndZoom): boolean {
    if (!previous) {
      return true;
    }
    if (isEmpty(previous) && isEmpty(current)) {
      return false;
    }
    const distance = turf.distance(current.viewport, previous.viewport, { units: 'meters' });
    return (
      !turf.booleanContains(turf.bboxPolygon(current.viewport), turf.bboxPolygon(previous.viewport)) &&
      distance > MIN_VIEWPORT_DISTANCE
    );
  }

  private shouldLoadCountBoroughAndCity(zoom: number): boolean {
    return !this.shouldLoadByZoomValue(zoom, `boroughCount.maxZoom`);
  }

  private isCountBoroughDependenciesChanged(prev: ICountBoroughDependencies, curr: ICountBoroughDependencies): boolean {
    if (!prev) {
      return true;
    }

    const oldValue: ICountBoroughDependencies = { ...prev, viewportZoom: null };
    const newValue: ICountBoroughDependencies = { ...curr, viewportZoom: null };

    return (
      !isEqual(oldValue, newValue) ||
      this.shouldLoadCountBoroughAndCity(prev.viewportZoom.zoom) !==
        this.shouldLoadCountBoroughAndCity(curr.viewportZoom.zoom)
    );
  }

  private isCountCityDependenciesChanged(prev: ICountCityDependencies, curr: ICountCityDependencies): boolean {
    if (!prev) {
      return true;
    }

    const oldValue: ICountCityDependencies = { ...prev, viewportZoom: null };
    const newValue: ICountCityDependencies = { ...curr, viewportZoom: null };

    return (
      !isEqual(oldValue, newValue) ||
      this.shouldLoadCountBoroughAndCity(prev.viewportZoom.zoom) !==
        this.shouldLoadCountBoroughAndCity(curr.viewportZoom.zoom)
    );
  }

  private createCountBoroughDependencies(
    combinedDependencies: CountBoroughCombinedDependencies
  ): ICountBoroughDependencies {
    const [viewportZoom, projectsFilter, projectsShown, interventionsFilter, interventionsShown] = combinedDependencies;
    return {
      viewportZoom: this.getViewportAndZoom(viewportZoom),
      projectsFilter,
      projectsShown,
      interventionsFilter,
      interventionsShown
    };
  }

  private createCountCityDependencies(combinedDependencies: CountCityCombinedDependencies): ICountCityDependencies {
    const [viewportZoom, rtuProjectCriteria, taxonomies] = combinedDependencies;
    return {
      viewportZoom: this.getViewportAndZoom(viewportZoom),
      rtuProjectCriteria,
      taxonomies
    };
  }
}

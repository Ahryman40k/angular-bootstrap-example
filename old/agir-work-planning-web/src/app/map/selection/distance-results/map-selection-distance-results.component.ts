import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import * as turf from '@turf/turf';
import {
  IAsset,
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionPaginatedSearchRequest,
  IProjectPaginatedSearchRequest,
  IRtuProject,
  ProjectExpand
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep, remove } from 'lodash';
import { LngLat } from 'mapbox-gl';
import { combineLatest, Observable, of, ReplaySubject } from 'rxjs';
import { debounceTime, filter, map, share, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { bboxToHttpParam } from 'src/app/shared/http/spatial';
import { PROJECT_SEARCH_FIELDS_PARAMS } from 'src/app/shared/models/projects/search-fields-params';
import { GlobalFilterService } from 'src/app/shared/services/filters/global-filter.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';

import { IDistanceFilter } from '../../../shared/models/filters/distance-filter';
import { IGlobalFilter } from '../../../shared/models/filters/global-filter';
import { INTERVENTION_FIELDS } from '../../../shared/models/findOptions/interventionFields';
import { IRtuProjectCriteria } from '../../../shared/models/rtu-project-criteria';
import { MapSourceId, MapSourceService } from '../../../shared/services/map-source.service';
import { RtuProjectService } from '../../../shared/services/rtu-project.service';

interface IDistanceResult {
  id?: string;
}

const MAP_CIRCLE_STEPS = 50;
const SEARCH_DEBOUNCE_TIME = 200;

const DISTANCE_INTERVENTION_SEARCH_FIELDS_PARAMS = [
  INTERVENTION_FIELDS.ASSETS,
  INTERVENTION_FIELDS.INTERVENTION_AREA,
  INTERVENTION_FIELDS.INTERVENTION_NAME,
  INTERVENTION_FIELDS.INTERVENTION_TYPE_ID,
  INTERVENTION_FIELDS.PLANIFICATION_YEAR,
  INTERVENTION_FIELDS.ESTIMATE,
  INTERVENTION_FIELDS.REQUESTOR_ID,
  INTERVENTION_FIELDS.DECESION_REQUIRED,
  INTERVENTION_FIELDS.PROGRAM_ID,
  INTERVENTION_FIELDS.STATUS,
  INTERVENTION_FIELDS.EXECUTOR_ID,
  INTERVENTION_FIELDS.BOROUGH_ID
];

@Component({
  selector: 'app-map-selection-distance-results',
  templateUrl: './map-selection-distance-results.component.html'
})
export class MapSelectionDistanceResultsComponent extends BaseComponent implements OnInit, OnDestroy {
  private readonly pointSubject = new ReplaySubject<LngLat>(1);
  private _point: LngLat;

  @Input() public asset: IAsset;
  @Input() public intervention: IEnrichedIntervention;
  @Input() public project: IEnrichedProject;

  public get point(): LngLat {
    return this._point;
  }
  @Input()
  public set point(point: LngLat) {
    if (this._point === point) {
      return;
    }
    this._point = point;
    this.pointSubject.next(this._point);
  }

  public interventions$: Observable<IEnrichedIntervention[]>;
  public projects$: Observable<IEnrichedProject[]>;

  public rtuProjects$: Observable<IRtuProject[]>;
  public partnerRtuProjects: IRtuProject[] = [];
  public cityRtuProjects: IRtuProject[] = [];
  public boroughRtuProjects: IRtuProject[] = [];

  public resultsShown: boolean;

  public get projectsShown(): boolean {
    return this.projectService.projectsShown;
  }

  public get interventionsShown(): boolean {
    return this.interventionService.interventionsShown;
  }

  public get rtuProjectsShown(): boolean {
    return (
      this.rtuProjectService.boroughProjectsShown ||
      this.rtuProjectService.partnerProjectsShown ||
      this.rtuProjectService.linkedCityProjectsShown
    );
  }

  constructor(
    private readonly interventionService: InterventionService,
    private readonly projectService: ProjectService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly mapService: MapService,
    private readonly mapSourceService: MapSourceService
  ) {
    super();
  }

  public ngOnInit(): void {
    super.ngOnInit();
    this.interventions$ = this.initInterventionSearchObservable();
    this.projects$ = this.initProjectSearchObservable();
    this.rtuProjects$ = this.initRtuProjectSearchObservable();
    this.initMapCircle();
    this.initResultsShown();
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.mapSourceService.clearSource(MapSourceId.dynamicSelectionRadius);
  }

  private initResultsShown(): void {
    this.globalFilterService.distanceFilter$.subscribe(x => {
      this.resultsShown = x.distanceEnabled;
    });
  }

  private initMapCircle(): void {
    combineLatest(this.pointSubject, this.globalFilterService.distanceFilter$, this.mapService.mapLoaded$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([point, distanceFilter]) => {
        if (distanceFilter.distanceEnabled && distanceFilter.distance) {
          const circle = turf.circle(point.toArray(), distanceFilter.distance, {
            steps: MAP_CIRCLE_STEPS,
            units: 'meters'
          });
          this.mapSourceService.setSource(MapSourceId.dynamicSelectionRadius, [circle]);
        } else {
          this.mapSourceService.setSource(MapSourceId.dynamicSelectionRadius, []);
        }
      });
  }

  private initInterventionSearchObservable(): Observable<IEnrichedIntervention[]> {
    return this.createSearchObservable(
      () => this.intervention,
      ([point, distanceFilter, , interventionFilter]) => {
        const filterClone = cloneDeep(interventionFilter);
        if (distanceFilter.distanceEnabled) {
          filterClone.interventionAreaBbox = this.createBBoxHttpParams(point, distanceFilter.distance);
        }
        filterClone.project = 'null';
        filterClone.fields = DISTANCE_INTERVENTION_SEARCH_FIELDS_PARAMS.join(',');
        return this.interventionService.searchInterventions(filterClone);
      },
      this.getInterventionFilterObservable()
    );
  }

  private initProjectSearchObservable(): Observable<IEnrichedProject[]> {
    return this.createSearchObservable(
      () => this.project,
      ([point, distanceFilter, , projectFilter]) => {
        const filterClone = cloneDeep(projectFilter);
        if (distanceFilter.distanceEnabled) {
          filterClone.bbox = this.createBBoxHttpParams(point, distanceFilter.distance);
        }
        filterClone.fields = PROJECT_SEARCH_FIELDS_PARAMS.join(',');
        filterClone.expand = [ProjectExpand.programBook];
        return this.projectService.searchProjects(filterClone).pipe(
          map(x => x.items),
          switchMap(projects => {
            return this.projectService.addInterventionsToProjectPni(projects);
          })
        );
      },
      this.getProjectFilterObservable()
    );
  }

  private initRtuProjectSearchObservable(): Observable<IRtuProject[]> {
    return this.createSearchObservable(
      null,
      ([point, distanceFilter, globalFilter, rtuProjectFilter]) => {
        const filterClone = cloneDeep(rtuProjectFilter);
        if (distanceFilter.distanceEnabled) {
          filterClone.bbox = this.createBBoxHttpParams(point, distanceFilter.distance);
        }
        filterClone.fields = ['dateStart', 'dateEnd', 'name', 'partnerId', 'status', 'type', 'audit'];
        return this.rtuProjectService.getRtuProjects(filterClone).pipe(map(x => x.items));
      },
      this.getRtuProjectFilterObservable()
    );
  }

  /**
   * Creates an observable that combines the point to search from, the global filters and optional additional dependency.
   * F: Filter
   * AR: Array of R
   * R: Result
   * @param objectToRemoveFromResultsFunc The function to retrieve the object to remove from the results.
   * @param filterObs The specific object filter observable.
   * @param mapFunc The function to map the results.
   */
  private createSearchObservable<F, AR extends R[], R extends IDistanceResult>(
    objectToRemoveFromResultsFunc: () => R,
    switchMapFunc: (result: [LngLat, IDistanceFilter, IGlobalFilter, F]) => Observable<AR>,
    filterObs: Observable<F> = of(null)
  ): Observable<AR> {
    return combineLatest(
      this.pointSubject,
      this.globalFilterService.distanceFilter$,
      this.globalFilterService.filter$,
      filterObs
    ).pipe(
      debounceTime(SEARCH_DEBOUNCE_TIME),
      filter(([, distanceFilter]) => distanceFilter.distanceEnabled),
      switchMap(x => switchMapFunc(x)),
      map(results => {
        const objectToRemoveFromResults = objectToRemoveFromResultsFunc ? objectToRemoveFromResultsFunc() : null;
        if (objectToRemoveFromResults) {
          remove(results, r => r.id === objectToRemoveFromResults.id);
        }
        return results;
      }),
      takeUntil(this.destroy$),
      share()
    );
  }

  private getInterventionFilterObservable(): Observable<IInterventionPaginatedSearchRequest> {
    return combineLatest(
      this.interventionService.filter$,
      this.interventionService.interventionChanged$.pipe(startWith(null))
    ).pipe(
      takeUntil(this.destroy$),
      map(([f]) => f)
    );
  }

  public getProjectFilterObservable(): Observable<IProjectPaginatedSearchRequest> {
    return combineLatest(this.projectService.filter$, this.projectService.projectChanged$.pipe(startWith(null))).pipe(
      takeUntil(this.destroy$),
      map(([f]) => f)
    );
  }

  public getRtuProjectFilterObservable(): Observable<IRtuProjectCriteria> {
    return this.rtuProjectService.rtuFilter$.pipe(
      takeUntil(this.destroy$),
      map(f => f)
    );
  }

  private createCircle(point: LngLat, distanceMeters: number): turf.Feature<turf.Polygon> {
    const circle = turf.circle(turf.point(point.toArray()), distanceMeters, { units: 'meters' });
    return circle;
  }

  private createBBox(point: LngLat, distanceMeters: number): turf.BBox {
    const circle = this.createCircle(point, distanceMeters);
    return turf.bbox(circle);
  }

  private createBBoxHttpParams(point: LngLat, distanceMeters: number): string {
    return bboxToHttpParam(this.createBBox(point, distanceMeters));
  }
}

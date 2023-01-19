import { Injectable, OnDestroy } from '@angular/core';
import * as turf from '@turf/turf';
import {
  IEnrichedIntervention,
  IEnrichedProject,
  IRtuProject,
  Permission,
  ProjectStatus
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { isEmpty, isNil } from 'lodash';
import { GeoJSONSource } from 'mapbox-gl';
import { combineLatest, interval, Observable, Subject } from 'rxjs';
import { debounceTime, distinct, map, skipUntil, startWith, takeUntil, tap } from 'rxjs/operators';

import { IGeoJsonSource } from '../models/map/geo-json-source';
import { ObjectType } from '../models/object-type/object-type';
import { UserService } from '../user/user.service';
import { ComparisonService } from './comparison.service';
import { InterventionService } from './intervention.service';
import { MapDataService } from './map-data.service';
import { MapHighlightService } from './map-highlight/map-highlight.service';
import { MapHoverService } from './map-hover/map-hover.service';
import { MapService } from './map.service';
import { IProjectIntervals, ProjectService } from './project.service';
import { RtuProjectService } from './rtu-project.service';
import { SearchObjectsService } from './search-objects.service';
const SOURCE_DEBOUNCE_TIME = 500;
export enum MapSourceId {
  assetsPins = 'assets-pins',
  addressesPins = 'addresses-pins',
  intervention = 'intervention-areas',
  countByBorough = 'count-by-borough',
  countByCity = 'count-by-city',
  interventionAreasSecondary = 'intervention-areas-secondary',
  interventionAreasSecondaryDecisionRequired = 'intervention-areas-secondary-decision-required',
  interventionPins = 'intervention-pins',
  decisionRequiredPins = 'decision-required-pins',
  interventionCreationAreas = 'intervention-creation-areas',
  objectPins = 'object-pins',
  pastProjects = 'past-project-areas',
  pastRtuProjects = 'past-rtu-project-areas',
  pastProjectsPins = 'past-project-pins',
  pastProjectsPinsHighlighted = 'past-project-pins-highlighted',
  pastRtuProjectsPins = 'past-rtu-project-pins',
  presentProjects = 'present-project-areas',
  presentPlannedProjects = 'present-planned-project-areas',
  presentPostponedProjects = 'present-postponed-project-areas',
  presentReplannedProjects = 'present-replanned-project-areas',
  presentRtuProjects = 'present-rtu-project-areas',
  presentProjectsPins = 'present-project-pins',
  presentProjectsPinsHighlighted = 'present-project-pins-highlighted',
  presentRtuProjectsPins = 'present-rtu-project-pins',
  futureProjects = 'future-project-areas',
  futureRtuProjects = 'future-rtu-project-areas',
  futureProjectsPins = 'future-project-pins',
  futureProjectsPinsHighlighted = 'future-project-pins-highlighted',
  futureRtuProjectsPins = 'future-rtu-project-pins',
  multipleYearsProjects = 'multiple-years-project-areas',
  multipleYearsPlannedProjects = 'multiple-years-planned-project-areas',
  multipleYearsPostponedProjects = 'multiple-years-postponed-project-areas',
  multipleYearsReplannedProjects = 'multiple-years-replanned-project-areas',
  projectCreation = 'project-creation-areas',
  mouseLeaveZone = 'mouse-leave-zone',
  dynamicSelectionRadius = 'dynamic-selection-radius',
  circleComparison = 'circle-comparison'
}

export enum HaloSourceIds {
  interventionHalo = 'intervention-halo',
  interventionCreationHalo = 'intervention-creation-halo'
}

const addressSourceIds: MapSourceId[] = [MapSourceId.addressesPins];

const interventionSourceIds: MapSourceId[] = [
  MapSourceId.intervention,
  MapSourceId.interventionAreasSecondary,
  MapSourceId.interventionAreasSecondaryDecisionRequired,
  MapSourceId.interventionCreationAreas,
  MapSourceId.objectPins,
  MapSourceId.circleComparison
];

const projectSourceIds: MapSourceId[] = [
  MapSourceId.pastProjects,
  MapSourceId.presentProjects,
  MapSourceId.multipleYearsProjects,
  MapSourceId.futureProjects,
  MapSourceId.objectPins,
  MapSourceId.circleComparison
];
const plannedProjectSourceIds: MapSourceId[] = [
  MapSourceId.multipleYearsPlannedProjects,
  MapSourceId.presentPlannedProjects
];
const postponedProjectSourceIds: MapSourceId[] = [
  MapSourceId.multipleYearsPostponedProjects,
  MapSourceId.presentPostponedProjects
];
const replannedProjectSourceIds: MapSourceId[] = [
  MapSourceId.multipleYearsReplannedProjects,
  MapSourceId.presentReplannedProjects
];
const rtuProjectSourceIds: MapSourceId[] = [
  MapSourceId.pastRtuProjects,
  MapSourceId.presentRtuProjects,
  MapSourceId.futureRtuProjects,
  MapSourceId.objectPins,
  MapSourceId.circleComparison
];

@Injectable()
export class MapSourceService implements OnDestroy {
  private readonly destroySubject = new Subject();
  private readonly destroy$ = this.destroySubject.asObservable();

  constructor(
    private readonly mapService: MapService,
    private readonly mapDataService: MapDataService,
    private readonly mapHighlightService: MapHighlightService,
    private readonly mapHoverService: MapHoverService,
    private readonly interventionService: InterventionService,
    private readonly projectService: ProjectService,
    private readonly comparisonService: ComparisonService,
    private readonly rtuProjectService: RtuProjectService,
    private readonly searchObjectsService: SearchObjectsService,
    private readonly userService: UserService
  ) {
    this.createInterventionsObservable();
    this.createProjectsObservable();
    this.createRtuProjectsObservable();
    this.createPinsObservable();
    this.createBoroughCountsObservable();
    this.createCityCountsObservable();
    this.createHighlightedSources();
    this.createHighlightedAssetPins();
    this.createHoverSources();
  }

  public ngOnDestroy(): void {
    this.destroySubject.next();
  }

  public clearSource(sourceId: MapSourceId | HaloSourceIds): void {
    this.setSource(sourceId, []);
  }

  public clearSources(sourceIds: (MapSourceId | HaloSourceIds)[]): void {
    this.setSources(sourceIds, []);
  }

  public clearProjectSources(): void {
    this.clearSources(projectSourceIds);
  }

  public setSource(sourceId: MapSourceId | HaloSourceIds, features: turf.Feature[]): void {
    const source = this.mapService.map?.map.getSource(sourceId) as GeoJSONSource;
    if (!source) {
      return;
    }
    source.setData(turf.featureCollection(features || []) as any);
  }

  public setSources(sourceIds: (MapSourceId | HaloSourceIds)[], features: turf.Feature[]): void {
    for (const sourceId of sourceIds) {
      this.setSource(sourceId, features);
    }
  }

  public setInterventionAreas(interventions: IEnrichedIntervention[]): void {
    if (!interventions || interventions.length === 0) {
      this.clearSource(MapSourceId.intervention);
      return;
    }
    const interventionsFeatures = this.interventionService.getAreaFeatures(interventions);
    this.setSource(MapSourceId.intervention, interventionsFeatures);
  }

  public setInterventionAreasSecondary(interventions: IEnrichedIntervention[]): void {
    if (!interventions || interventions.length === 0) {
      this.clearSource(MapSourceId.interventionAreasSecondary);
      this.clearSource(MapSourceId.interventionAreasSecondaryDecisionRequired);
      return;
    }
    const interventionsFeatures = this.interventionService.getAreaFeatures(
      interventions.filter(i => !i.decisionRequired)
    );
    const interventionsDRFeatures = this.interventionService.getAreaFeatures(
      interventions.filter(i => i.decisionRequired)
    );
    this.setSource(MapSourceId.interventionAreasSecondary, interventionsFeatures);
    this.setSource(MapSourceId.interventionAreasSecondaryDecisionRequired, interventionsDRFeatures);
  }

  public setProjectsSources(projects: IEnrichedProject[]): void {
    if (!projects || projects.length === 0) {
      this.clearSources([
        ...projectSourceIds,
        ...plannedProjectSourceIds,
        ...postponedProjectSourceIds,
        ...replannedProjectSourceIds
      ]);
      return;
    }

    const plannedProject = projects
      .filter(e => e.status === ProjectStatus.planned || isNil(e.status))
      .map(e => {
        e.status = ProjectStatus.planned;
        return e;
      });

    const replannedProject = projects.filter(e => e.status === ProjectStatus.replanned);
    const postponedProject = projects.filter(e => e.status === ProjectStatus.postponed);
    const othersProject = projects.filter(
      e =>
        e.status !== ProjectStatus.planned &&
        e.status !== ProjectStatus.replanned &&
        e.status !== ProjectStatus.postponed
    );

    this.setSourceArea(othersProject, MapSourceId.presentProjects, MapSourceId.multipleYearsProjects);
    this.setSourceArea(plannedProject, MapSourceId.presentPlannedProjects, MapSourceId.multipleYearsPlannedProjects);
    this.setSourceArea(
      postponedProject,
      MapSourceId.presentPostponedProjects,
      MapSourceId.multipleYearsPostponedProjects
    );
    this.setSourceArea(
      replannedProject,
      MapSourceId.presentReplannedProjects,
      MapSourceId.multipleYearsReplannedProjects
    );

    const allIntervals = this.projectService.getProjectsYears(projects);
    this.setProjectsCommonSources(allIntervals);
  }

  public setSourceArea(
    projects: IEnrichedProject[],
    mapSourceId: MapSourceId,
    mapSourceMultiplYears: MapSourceId
  ): void {
    if (isEmpty(projects)) {
      this.clearSource(mapSourceId);
    }
    const intervals = this.projectService.getProjectsYears(projects);
    this.setSource(mapSourceId, this.projectService.getProjectsAreas(intervals.presentProjects));
    this.setSource(mapSourceMultiplYears, this.projectService.getProjectsAreas(intervals.multipleYearsProjects));
  }

  public setProjectsCommonSources(intervals: IProjectIntervals): void {
    this.setSource(MapSourceId.pastProjects, this.projectService.getProjectsAreas(intervals.pastProjects));
    this.setSource(MapSourceId.futureProjects, this.projectService.getProjectsAreas(intervals.futureProjects));
  }

  public setRtuProjectsSources(rtuProjects: IRtuProject[]): void {
    if (!rtuProjects || rtuProjects.length === 0) {
      this.clearSources(rtuProjectSourceIds);
      return;
    }
    const intervals = this.rtuProjectService.getRtuProjectsYears(rtuProjects);

    this.setSource(MapSourceId.pastRtuProjects, this.rtuProjectService.getRtuProjectsAreas(intervals.pastProjects));
    this.setSource(
      MapSourceId.presentRtuProjects,
      this.rtuProjectService.getRtuProjectsAreas(intervals.presentProjects)
    );
    this.setSource(MapSourceId.futureRtuProjects, this.rtuProjectService.getRtuProjectsAreas(intervals.futureProjects));
  }

  public setCriteriaSource(interventions: IEnrichedIntervention[] = [], projects: IEnrichedProject[] = []): void {
    if (!this.comparisonService.haveCriteriaValue) {
      this.clearSource(MapSourceId.circleComparison);
      return;
    }
    const criteriaInterventions = this.comparisonService.getInterventionCriteria(interventions);
    const criteriaProjects = this.comparisonService.getProjectsCriteria(projects);

    const criterias = [...criteriaProjects, ...criteriaInterventions];

    this.setSource(MapSourceId.circleComparison, criterias);
  }

  public setPinSources(
    interventions: IEnrichedIntervention[] = [],
    projects: IEnrichedProject[] = [],
    rtuProjects: IRtuProject[] = []
  ): void {
    const projectPins = this.projectService.getProjectPins(projects);
    const interventionPins = this.interventionService.getInterventionPins(interventions);
    const rtuProjectPins = this.rtuProjectService.getRtuProjectPins(rtuProjects);

    const pins = [...projectPins, ...interventionPins, ...rtuProjectPins];

    this.setSource(MapSourceId.objectPins, pins);
  }

  private createHighlightedSources(): void {
    combineLatest(
      this.createCommonObservable(),
      this.mapHighlightService.highlightedProjects$.pipe(startWith(null)),
      this.mapHighlightService.highlightedRtuProjects$.pipe(startWith(null)),
      this.mapHighlightService.highlightedInterventions$.pipe(startWith(null)),
      this.mapHighlightService.highlightedAddresses$.pipe(startWith(null))
    )
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.updateHighlightedSources());
  }

  private createHoverSources(): void {
    combineLatest(
      this.createCommonObservable(),
      this.mapHoverService.hoveredProjects$.pipe(startWith(null)),
      this.mapHoverService.hoveredRtuProjects$.pipe(startWith(null)),
      this.mapHoverService.hoveredInterventions$.pipe(startWith(null)),
      this.mapHoverService.hoveredAddresses$.pipe(startWith(null))
    )
      .pipe(takeUntil(this.destroy$), debounceTime(300))
      .subscribe(() => this.updateHoveredSources());
  }

  private createInterventionsObservable(): void {
    combineLatest(this.createCommonObservable(), this.mapDataService.interventions$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.updateHighlightedSources();
        this.updateHoveredSources();
      });
  }

  private createProjectsObservable(): void {
    combineLatest(this.createCommonObservable(), this.mapDataService.projects$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, projects]) => {
        this.setProjectsSources(projects);
        this.updateHighlightedSources();
        this.updateHoveredSources();
      });
  }

  private createRtuProjectsObservable(): void {
    combineLatest(this.createCommonObservable(), this.mapDataService.rtuProjects$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, rtuProjects]) => {
        this.setRtuProjectsSources(rtuProjects);
        this.updateHighlightedSources();
        this.updateHoveredSources();
      });
  }

  private createPinsObservable(): void {
    combineLatest(
      this.createCommonObservable(),
      this.mapDataService.interventions$,
      this.mapDataService.projects$,
      this.mapDataService.rtuProjects$,
      this.comparisonService.criteriaValues$,
      interval().pipe(
        skipUntil(this.comparisonService.criteriaValues$),
        map(() => this.mapService.zoom),
        distinct(),
        tap(() => this.clearSource(MapSourceId.circleComparison)),
        debounceTime(SOURCE_DEBOUNCE_TIME)
      )
    )
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, interventions, projects, rtuProjects]) => {
        this.setPinSources(interventions, projects, rtuProjects);
        this.setCriteriaSource(interventions, projects);
        this.updateHighlightedSources();
      });
  }

  private createBoroughCountsObservable(): void {
    combineLatest(this.createCommonObservable(), this.mapDataService.boroughCounts$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, boroughCounts]) => {
        this.setSource(MapSourceId.countByBorough, boroughCounts);
      });
  }

  private createCityCountsObservable(): void {
    combineLatest(this.createCommonObservable(), this.mapDataService.cityCounts$)
      .pipe(takeUntil(this.destroy$))
      .subscribe(([, cityCounts]) => {
        this.setSource(MapSourceId.countByCity, cityCounts);
      });
  }

  private createCommonObservable(): Observable<unknown> {
    return combineLatest(this.mapService.mapLoaded$).pipe(takeUntil(this.destroy$));
  }

  private updateHighlightedSources(): void {
    this.updateHighlightedInterventionData();

    const highlightedProjectIds = this.mapHighlightService.highlightedProjects.map(x => x.id);
    const sources = [postponedProjectSourceIds, replannedProjectSourceIds, plannedProjectSourceIds, projectSourceIds];
    sources.map(ids => {
      const sourceIds = this.getSources(ids);
      this.updateHighlightedSourcesData(sourceIds, highlightedProjectIds);
    });

    const highlightedRtuProjectIds = this.mapHighlightService.highlightedRtuProjects.map(x => x.id);
    const rtuProjectSources = this.getSources(rtuProjectSourceIds);
    this.updateHighlightedSourcesData(rtuProjectSources, highlightedRtuProjectIds);

    const highlightedAddressIds = this.mapHighlightService.highlightedAddresses.map(x => x.id);
    const addressSources = this.getSources(addressSourceIds);
    this.updateHighlightedSourcesData(addressSources, highlightedAddressIds);

    this.updateHighlightedPinsSource();
  }

  private updateHoveredSources(): void {
    const dict = {
      [ObjectType.project]: projectSourceIds,
      [ObjectType.rtuProject]: rtuProjectSourceIds,
      [ObjectType.intervention]: interventionSourceIds,
      [ObjectType.address]: addressSourceIds
    };

    [
      this.mapHoverService.hoveredProjects,
      this.mapHoverService.hoveredRtuProjects,
      this.mapHoverService.hoveredAddresses,
      this.mapHoverService.hoveredInterventions
    ].forEach((objects: any[]) => {
      if (!objects?.length) {
        return;
      }
      const objectSourceIds = objects.map(x => x.id);
      const type = this.searchObjectsService.getResultType(objects[0]);
      const objectSources: IGeoJsonSource[] = this.getSources(dict[type]);
      this.updateHoverdedSourcesData(objectSources, objectSourceIds);
    });

    this.setInterventionAreas(this.mapHoverService.hoveredInterventions);
  }

  private updateHighlightedInterventionData(): void {
    const highlightedInterventions = this.mapHighlightService.highlightedInterventions;
    const interventionSources = this.getSources(interventionSourceIds);
    this.updateHighlightedSourcesData(
      interventionSources,
      highlightedInterventions.map(x => x.id)
    );

    this.setInterventionAreas(highlightedInterventions);
  }

  private updateHighlightedSourcesData(sources: IGeoJsonSource[], highlightedIds: string[]): void {
    if (!sources?.length) {
      return;
    }
    sources.forEach(source => {
      const data = source._data;
      if (this.mapHighlightService.isAnythingHighlighted) {
        data.features.forEach(f => (f.properties._highlighted = highlightedIds.includes(f.properties.id)));
      } else {
        data.features.forEach(f => (f.properties._highlighted = true));
      }
      source.setData(data);
    });
  }

  private updateHoverdedSourcesData(sources: IGeoJsonSource[], hoveredIds: string[]): void {
    if (!sources?.length) {
      return;
    }
    sources.forEach(source => {
      const data = source._data;
      if (this.mapHoverService.isAnythingHovered) {
        data.features.forEach(f => (f.properties._hovered = hoveredIds.includes(f.properties.id)));
      } else {
        data.features.forEach(f => (f.properties._hovered = true));
      }
      source.setData(data);
    });
  }

  private updateHighlightedPinsSource(): void {
    const pinSources = this.getSources([MapSourceId.objectPins]);
    const ids = [
      ...this.mapHighlightService.highlightedProjects.map(p => p.id),
      ...this.mapHighlightService.highlightedRtuProjects.map(p => p.id),
      ...this.mapHighlightService.highlightedInterventions.map(i => i.id)
    ];

    this.updateHighlightedSourcesData(pinSources, ids);
  }

  private getSources(mapSourceIds: MapSourceId[]): IGeoJsonSource[] {
    return mapSourceIds.map(x => (this.mapService.map.map.getSource(x) as any) as IGeoJsonSource);
  }

  private createHighlightedAssetPins(): void {
    this.mapHighlightService.highlightedAssets$.subscribe(async x => {
      if (!(await this.userService.hasPermission(Permission.ASSET_READ))) {
        return;
      }

      const pins = x?.map(asset => {
        if (asset?.geometry) {
          return turf.pointOnFeature(asset?.geometry);
        }
      });
      if (pins) {
        this.setSource(MapSourceId.assetsPins, pins);
      }
    });
  }
}

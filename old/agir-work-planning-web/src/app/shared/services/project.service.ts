import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import {
  IComment,
  ICountBy,
  IEnrichedAnnualProgram,
  IEnrichedIntervention,
  IEnrichedPaginatedProjects,
  IEnrichedProgramBook,
  IEnrichedProject,
  IGeometry,
  IPlainIntervention,
  IPlainProject,
  IPolygon,
  IProjectCountBySearchRequest,
  IProjectPaginatedSearchRequest,
  IProjectSearchRequest,
  ProjectExpand,
  ProjectStatus,
  ProjectType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assign, cloneDeep, findIndex, range, uniqBy } from 'lodash';
import { BehaviorSubject, combineLatest, merge, Observable, of } from 'rxjs';
import { map, pairwise, startWith, switchMap } from 'rxjs/operators';
import { ObjectPinType } from 'src/app/map/config/layers/map-enums';

import { environment } from '../../../environments/environment';
import { buildHttpParams } from '../http/params-builder';
import { bboxToHttpParam } from '../http/spatial';
import { IGlobalFilter, PROJECTS_KEYS } from '../models/filters/global-filter';
import { GlobalFilterShownElement } from '../models/filters/global-filter-shown-element';
import { PROJECT_FIELDS } from '../models/findOptions/projectFields';
import { TimeInterval } from '../models/time-interval.ts';
import { Utils } from '../utils/utils';
import { BroadcastEvent, BroadcastEventException, WindowBroadcastService } from '../window/window-broadcast.service';
import { GlobalFilterService } from './filters/global-filter.service';
import { InterventionService } from './intervention.service';
import { SpatialAnalysisService } from './spatial-analysis.service';
import { TaxonomiesService } from './taxonomies.service';

export interface IProjectIntervals {
  pastProjects: IEnrichedProject[];
  presentProjects: IEnrichedProject[];
  futureProjects: IEnrichedProject[];
  multipleYearsProjects: IEnrichedProject[];
}

export interface IYearInterval {
  min: number;
  max: number;
}

export const defaultProjectSearchStatuses = [
  ProjectStatus.finalOrdered,
  ProjectStatus.preliminaryOrdered,
  ProjectStatus.planned,
  ProjectStatus.programmed,
  ProjectStatus.replanned,
  ProjectStatus.postponed
];

export const allProjectStatus: string[] = [
  ProjectStatus.finalOrdered,
  ProjectStatus.preliminaryOrdered,
  ProjectStatus.planned,
  ProjectStatus.programmed,
  ProjectStatus.replanned,
  ProjectStatus.postponed,
  ProjectStatus.canceled
];

const DUPLICATE_AREA_TOLERANCE_PERCENTAGE = 95;
const FROM_YEAR_STORAGE_KEY = 'agir-work-planning-from-year';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  public isLoadingProjects$ = new BehaviorSubject<boolean>(false);
  public searchProjectResults$ = new BehaviorSubject<IEnrichedProject[]>([]);
  public isCreating = false;
  private _fromYear: number = +localStorage.getItem(FROM_YEAR_STORAGE_KEY) || new Date().getFullYear();

  public searchResults: IEnrichedPaginatedProjects;

  private readonly filterSubject$ = new BehaviorSubject<IProjectSearchRequest>({});
  public readonly filter$ = this.filterSubject$.asObservable();

  private readonly projectsShownSubject = new BehaviorSubject<boolean>(true);
  public projectsShown$ = this.projectsShownSubject.asObservable();

  public get fromYear(): number {
    return this._fromYear;
  }
  public set fromYear(year: number) {
    this.broadcastService.publish(BroadcastEvent.fromYearUpdated, year);
    localStorage.setItem(FROM_YEAR_STORAGE_KEY, year.toString());
  }

  public get projectsShown(): boolean {
    return this.projectsShownSubject.value;
  }
  public set projectsShown(v: boolean) {
    this.projectsShownSubject.next(v);
  }

  private readonly projectsReloadSubject = new BehaviorSubject<boolean>(true);
  public projectsReload$ = this.projectsReloadSubject.asObservable();
  public get projectsReload(): boolean {
    return this.projectsReloadSubject.value;
  }
  public set projectsReload(v: boolean) {
    this.projectsReloadSubject.next(v);
  }

  public get filter(): IProjectPaginatedSearchRequest {
    return this.filterSubject$.value;
  }
  public set filter(filter: IProjectPaginatedSearchRequest) {
    this.filterSubject$.next(filter);
  }

  public projectChanged$: Observable<unknown>;
  public fromYearChanged$: Observable<number>;

  constructor(
    private readonly spatialAnalysisService: SpatialAnalysisService,
    private readonly interventionService: InterventionService,
    private readonly http: HttpClient,
    private readonly broadcastService: WindowBroadcastService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly taxonomiesService: TaxonomiesService
  ) {
    this.projectChanged$ = merge(
      broadcastService.observable(BroadcastEvent.interventionCreated),
      broadcastService.observable(BroadcastEvent.interventionUpdated),
      broadcastService.observable(BroadcastEvent.projectCreated),
      broadcastService.observable(BroadcastEvent.projectUpdated)
    );
    this.projectChanged$.subscribe(() => {
      void this.updateResults();
    });
    this.globalFilterService.filter$
      .pipe(startWith(null), pairwise())
      .subscribe(([previousFilter, currentFilter]) => this.onGlobalFilterChanges(previousFilter, currentFilter));
    this.fromYearChanged$ = broadcastService.observable(BroadcastEvent.fromYearUpdated);
    this.fromYearChanged$.subscribe(year => (this._fromYear = year));
  }
  public getProjectLink(project: IEnrichedProject): string {
    return `window/projects/${project.id}/overview`;
  }
  public async setBboxFilter(bbox: number[]): Promise<void> {
    if (!this.searchResults?.items?.length) {
      this.filter = { bbox: bboxToHttpParam(bbox) };
    }
    await this.updateResults();
  }

  public patchFilter(value: IProjectPaginatedSearchRequest): void {
    const filter = assign(cloneDeep(this.filter), value);
    this.filter = filter;
  }

  public setSearchResults(paginatedProjects: IEnrichedPaginatedProjects): void {
    if (!paginatedProjects?.items?.length) {
      this.searchResults = null;
    } else {
      this.searchResults = paginatedProjects;
    }
  }

  public async updateResults(tempSearchObj: IProjectPaginatedSearchRequest = {}): Promise<void> {
    this.isLoadingProjects$.next(true);
    const results = await this.getProjects(tempSearchObj);
    this.searchProjectResults$.next(results.items);
    this.isLoadingProjects$.next(false);
  }

  public async getCountByBorough(): Promise<ICountBy[]> {
    if (!this.projectsShown) {
      return [];
    }
    const countByRequest: IProjectCountBySearchRequest = {
      ...this.filter,
      countBy: PROJECT_FIELDS.BOROUGH_ID,
      isGeolocated: true
    };
    return this.getCountBy(countByRequest).toPromise();
  }

  public getMapCountBy(countByRequest: IProjectCountBySearchRequest): Observable<ICountBy[]> {
    return combineLatest(this.projectsShown$, this.filter$).pipe(
      switchMap(([projectsShown, filter]) => {
        const searchObj: IProjectCountBySearchRequest = { ...filter, ...countByRequest };
        return projectsShown ? this.getCountBy(searchObj) : [];
      })
    );
  }
  public getCountBy(countByRequest: IProjectCountBySearchRequest): Observable<ICountBy[]> {
    return this.http.post<ICountBy[]>(`${environment.apis.planning.projects}/countBy`, countByRequest);
  }

  public projectsToFeatures(projects: IEnrichedProject[]): turf.Feature[] {
    return projects
      ?.filter(p => p.geometry)
      .map(x => {
        const pinGeometry = this.spatialAnalysisService.nearestCentroid(x.geometry);
        return { ...turf.feature(x.geometry), properties: { project: x, pinGeometry } } as turf.Feature;
      });
  }

  public async findProjectAreaByInterventions(interventions: IEnrichedIntervention[]): Promise<IGeometry> {
    const geometries = interventions.map(i => i.interventionArea.geometry);
    let projectArea = await this.searchProjectArea(geometries);
    projectArea = this.spatialAnalysisService.getUnifiedMultiPolygonGeometry(projectArea);
    return projectArea;
  }

  public async createProject(
    create: IPlainProject,
    broadcastException?: BroadcastEventException
  ): Promise<IPlainProject> {
    const newProject = await this.http.post<IPlainProject>(environment.apis.planning.projects, create).toPromise();
    if (broadcastException !== BroadcastEventException.projectCreate) {
      this.broadcastService.publish(BroadcastEvent.projectCreated);
    }
    return newProject;
  }

  public async editProject(
    id: string,
    project: IPlainProject,
    broadcastException?: BroadcastEventException
  ): Promise<void> {
    await this.http.put<IPlainProject>(`${environment.apis.planning.projects}/${id}`, project).toPromise();
    if (broadcastException !== BroadcastEventException.projectUpdate) {
      this.broadcastService.publish(BroadcastEvent.projectUpdated);
    }
  }

  public async getProject(id: string, expands?: ProjectExpand[]): Promise<IEnrichedProject> {
    const params = expands ? buildHttpParams({ expand: expands }) : undefined;
    return this.http
      .get<IEnrichedProject>(`${environment.apis.planning.projects}/${id}`, { params })
      .toPromise();
  }

  public getFullProject(id: string): Promise<IEnrichedProject> {
    return this.getProject(id, [
      ProjectExpand.interventions,
      ProjectExpand.annualProgram,
      ProjectExpand.programBook,
      ProjectExpand.assets
    ]);
  }
  public getProjectWithOutIntervention(id: string): Promise<IEnrichedProject> {
    return this.getProject(id, [ProjectExpand.annualProgram, ProjectExpand.programBook]);
  }

  public async getProjectsByIds(ids: string[], expand: ProjectExpand[]): Promise<IEnrichedProject[]> {
    const filters: IProjectPaginatedSearchRequest = {
      id: ids.join(','),
      expand
    };
    const httpParams = filters ? buildHttpParams(filters) : undefined;
    return (
      await this.http
        .get<IEnrichedPaginatedProjects>(environment.apis.planning.projects, { params: httpParams })
        .toPromise()
    ).items;
  }

  public async getFullProjectsByIds(ids: string[]): Promise<IEnrichedProject[]> {
    const expand = [
      ProjectExpand.interventions,
      ProjectExpand.annualProgram,
      ProjectExpand.programBook,
      ProjectExpand.assets
    ];
    return this.getProjectsByIds(ids, expand);
  }
  public async getProjectsWithOutInterventionByIds(ids: string[]): Promise<IEnrichedProject[]> {
    const expand = [ProjectExpand.annualProgram, ProjectExpand.programBook];
    return this.getProjectsByIds(ids, expand);
  }

  public async getProjectInterventions(project: IEnrichedProject): Promise<IPlainIntervention[]> {
    const projectInterventions: IPlainIntervention[] = [];
    for (const interventionId of project.interventionIds) {
      const intervention: IPlainIntervention = await this.interventionService.getIntervention(interventionId);
      projectInterventions.push(intervention);
    }
    return projectInterventions;
  }

  public async getProjects(filters?: IProjectPaginatedSearchRequest): Promise<IEnrichedPaginatedProjects> {
    Utils.removeObjectEmptyProperties(filters);
    if (!this.projectsShownSubject.value) {
      return {};
    }
    if (this.searchResults?.items?.length) {
      return this.searchResults;
    }
    const searchObj = { ...this.filter, ...filters };
    const httpParams = searchObj ? buildHttpParams(searchObj) : undefined;
    return this.http
      .get<IEnrichedPaginatedProjects>(environment.apis.planning.projects, { params: httpParams })
      .toPromise();
  }

  public async getPaginatedProjects(
    searchRequest?: IProjectPaginatedSearchRequest
  ): Promise<IEnrichedPaginatedProjects> {
    return this.http
      .post<IEnrichedPaginatedProjects>(`${environment.apis.planning.projects}/search`, searchRequest)
      .toPromise();
  }

  public searchProjects(searchRequest?: IProjectPaginatedSearchRequest): Observable<IEnrichedPaginatedProjects> {
    Utils.removeObjectEmptyProperties(searchRequest);
    searchRequest.status = searchRequest.status ? searchRequest.status : defaultProjectSearchStatuses;
    if (!this.projectsShownSubject.value) {
      return of({ items: [] });
    }
    return this.http.post<IEnrichedPaginatedProjects>(`${environment.apis.planning.projects}/search`, searchRequest);
  }

  public getDuplicate(
    projectId: string,
    startYear: number,
    endYear: number,
    area: IGeometry
  ): Observable<IEnrichedProject> {
    if (!startYear || !endYear || !area) {
      return of(null);
    }
    return this.searchProjects({
      bbox: bboxToHttpParam(turf.bbox(area))
    }).pipe(
      map(x => x.items),
      map(projects => {
        if (!projects || !projects.length) {
          return null;
        }
        return projects.find(x => this.isDuplicate(x, projectId, startYear, endYear, area));
      })
    );
  }

  public getNonGeolocatedDuplicate(
    startYear: number,
    endYear: number,
    executorId: string,
    boroughId: string
  ): Observable<IEnrichedProject> {
    if (!startYear || !endYear || !executorId || !boroughId) {
      return of(null);
    }
    return this.searchProjects({ projectTypeId: 'other', startYear, endYear, executorId, boroughId }).pipe(
      map(x => x.items),
      map(projects => {
        if (!projects || !projects.length) {
          return null;
        }
        return projects.find(x => this.isNonGeolocatedDuplicate(x, startYear, endYear, executorId, boroughId));
      })
    );
  }

  public async validateIntervention(
    intervention: IEnrichedIntervention,
    interventionsList: IEnrichedIntervention[],
    selectedProject?: IPlainProject
  ): Promise<boolean> {
    // Check if the intervention has a required decision
    if (!this.interventionService.canInteract(intervention)) {
      return false;
    }
    // Check if intervention exists
    if (findIndex(interventionsList, { id: intervention.id }) !== -1) {
      return false;
    }
    // Does the intervention already have a project
    const dbIntervention = await this.interventionService.getIntervention<IEnrichedIntervention>(intervention.id);
    if (dbIntervention.project) {
      return selectedProject && dbIntervention.project.id === selectedProject.id ? true : false;
    }
    return true;
  }

  public getAreaFeatures(projects: IPlainProject[]): turf.Feature[] {
    return projects.map(x => {
      return { ...turf.feature(x.geometry), properties: { projectId: x.id } } as turf.Feature;
    });
  }

  public getProjectsYears(projectList: IEnrichedProject[], year?: number): IProjectIntervals {
    if (year) {
      this.fromYear = year;
    }
    const intervals: IProjectIntervals = {
      pastProjects: [],
      presentProjects: [],
      futureProjects: [],
      multipleYearsProjects: []
    }; // Initialize the arrays
    for (const project of projectList) {
      if (this.isMultipleYearsProject(project)) {
        intervals.multipleYearsProjects.push(project);
      } else if (this.isProjectPast(project)) {
        intervals.pastProjects.push(project);
      } else if (this.isProjectPresent(project)) {
        intervals.presentProjects.push(project);
      } else if (this.isProjectFuture(project)) {
        intervals.futureProjects.push(project);
      }
    }
    return intervals;
  }

  public canInteract(project: IEnrichedProject): boolean {
    return (
      project &&
      [
        ProjectStatus.planned,
        ProjectStatus.postponed,
        ProjectStatus.programmed,
        ProjectStatus.replanned,
        ProjectStatus.preliminaryOrdered,
        ProjectStatus.finalOrdered
      ].includes(project.status as ProjectStatus)
    );
  }

  private isDuplicate(
    project: IEnrichedProject,
    projectId: string,
    startYear: number,
    endYear: number,
    area: IGeometry
  ): boolean {
    return (
      (!projectId || project.id !== projectId) &&
      project.startYear === startYear &&
      project.endYear === endYear &&
      this.spatialAnalysisService.someMeetIntersectionAreaPercentage(
        project.geometry,
        area,
        DUPLICATE_AREA_TOLERANCE_PERCENTAGE
      )
    );
  }

  private isNonGeolocatedDuplicate(
    project: IEnrichedProject,
    startYear: number,
    endYear: number,
    executorId: string,
    boroughId: string
  ): boolean {
    return (
      project.projectTypeId === ProjectType.other &&
      project.startYear === startYear &&
      project.endYear === endYear &&
      project.executorId === executorId &&
      project.boroughId === boroughId
    );
  }

  public async updateProject(project: IPlainProject): Promise<void> {
    const updateProject: IEnrichedProject = Object.assign({}, cloneDeep(project));
    delete updateProject.interventions;

    await this.http
      .put<IPlainProject>(`${environment.apis.planning.projects}/${project.id}`, updateProject)
      .toPromise();
    this.broadcastService.publish(BroadcastEvent.projectUpdated);
  }

  public async patchProject(
    project: IEnrichedProject,
    partial: Partial<IPlainProject>,
    broadcastException?: BroadcastEventException
  ): Promise<void> {
    const plainProject = this.convertEnrichedProjectToPlainProject(project);
    Object.assign(plainProject, partial);
    await this.http.put<IPlainProject>(`${environment.apis.planning.projects}/${project.id}`, plainProject).toPromise();
    if (
      broadcastException &&
      broadcastException !== BroadcastEventException.opportunityNoticeResponseInterventionCreation
    ) {
      this.broadcastService.publish(BroadcastEvent.projectUpdated);
    }
  }

  private convertEnrichedProjectToPlainProject(enrichedProject: IEnrichedProject): IPlainProject {
    return {
      boroughId: enrichedProject.boroughId,
      endYear: enrichedProject.endYear,
      executorId: enrichedProject.executorId,
      geometry: enrichedProject.geometry,
      globalBudget: enrichedProject.globalBudget,
      id: enrichedProject.id,
      importFlag: enrichedProject.importFlag,
      inChargeId: enrichedProject.inChargeId,
      interventionIds: enrichedProject.interventionIds,
      projectName: enrichedProject.projectName,
      projectTypeId: enrichedProject.projectTypeId,
      servicePriorities: enrichedProject.servicePriorities,
      startYear: enrichedProject.startYear,
      status: enrichedProject.status,
      streetName: enrichedProject.streetName,
      subCategoryIds: enrichedProject.subCategoryIds
    };
  }

  public getProjectColor(project: IEnrichedProject): string {
    if (!project) {
      return '';
    }
    if (this.isProjectPresent(project) || this.isMultipleYearsProject(project)) {
      return TimeInterval.present;
    }
    if (this.isProjectPast(project)) {
      return TimeInterval.past;
    }
    if (this.isProjectFuture(project)) {
      return TimeInterval.future;
    }
    return '';
  }

  public isMultipleYearsProject(project: IEnrichedProject): boolean {
    return (
      project.startYear !== project.endYear && project.startYear <= this.fromYear && project.endYear >= this.fromYear
    );
  }

  public isProjectPresent(project: IEnrichedProject): boolean {
    return project.startYear <= this.fromYear && this.fromYear <= project.endYear;
  }

  public isProjectPast(project: IEnrichedProject): boolean {
    return project.endYear < this.fromYear;
  }

  public isProjectFuture(project: IEnrichedProject): boolean {
    return this.fromYear < project.startYear;
  }

  public isProjectGeolocated(project: IEnrichedProject): boolean {
    return !this.isProjectNonGeolocated(project);
  }

  public isProjectNonGeolocated(project: IEnrichedProject): boolean {
    return project.projectTypeId === ProjectType.other && !project.geometry;
  }

  public generateProjectsMultiPolygon(
    projects: IEnrichedProject[]
  ): turf.helpers.Feature<
    turf.helpers.MultiPolygon,
    {
      [name: string]: any;
    }
  > {
    return turf.multiPolygon(projects.filter(p => p.geometry).map(p => p.geometry.coordinates as IPolygon));
  }

  public getProjectPins(projects: IEnrichedProject[]): turf.Feature<turf.Point>[] {
    return projects
      ?.filter(p => p.geometryPin)
      .map(p => {
        const point = turf.point(p.geometryPin);
        point.properties = this.getProjectFeatureProperties(p);
        return point;
      });
  }

  public getProjectsAreas(projects: IEnrichedProject[]): turf.Feature<turf.Polygon>[] {
    return projects
      ?.filter(p => p.geometry)
      .map(p => {
        const f = turf.feature(p.geometry as turf.Polygon);
        f.properties = this.getProjectFeatureProperties(p);
        return f;
      });
  }

  public getProjectProgramBooks(project: IEnrichedProject): IEnrichedProgramBook[] {
    if (!project) {
      return [];
    }
    return project.annualDistribution.annualPeriods.filter(p => p.programBookId).map(p => p.programBook);
  }

  public getProjectAnnualPrograms(project: IEnrichedProject): IEnrichedAnnualProgram[] {
    if (!project) {
      return [];
    }
    const annualPeriodsWithProgramBook = project.annualDistribution.annualPeriods.filter(x => !!x.programBookId);
    const annualPrograms = annualPeriodsWithProgramBook.map(x => x.programBook.annualProgram);
    return uniqBy(annualPrograms, a => a.id);
  }

  public getProjectYearRange(project: IEnrichedProject): number[] {
    return range(project.startYear, project.endYear + 1);
  }

  public getProjectComments(project: IEnrichedProject): IComment[] {
    const comments = [];
    if (project.comments?.length) {
      comments.push(...project.comments);
    }
    if (project.interventions?.length) {
      for (const intervention of project.interventions) {
        if (!intervention.comments?.length) {
          continue;
        }
        const projectVisibleComments = intervention.comments.filter(c => c.isProjectVisible);
        if (!projectVisibleComments?.length) {
          continue;
        }
        comments.push(...projectVisibleComments);
      }
    }
    return comments;
  }

  public getProjectProgram(project: IEnrichedProject, intervention?: IEnrichedIntervention): Observable<string> {
    const programId = intervention ? intervention.programId : project.interventions[0]?.programId;
    if (!programId) {
      return of(undefined);
    }

    return this.taxonomiesService
      .code(TaxonomyGroup.programType, programId)
      .pipe(map(programType => programType.properties?.acronym?.fr || programType?.label?.fr));
  }

  private getProjectFeatureProperties(project: IEnrichedProject): any {
    return {
      _highlighted: true,
      id: project.id,
      project,
      type: this.getProjectFeaturePinType(project)
    };
  }

  private getProjectFeaturePinType(project: IEnrichedProject): string {
    const interval = this.getProjectsYears([project]);
    if (interval.futureProjects.length) {
      return ObjectPinType.futureProject;
    }
    if (interval.pastProjects.length) {
      return ObjectPinType.pastProject;
    }
    if (project.status === ProjectStatus.canceled) {
      return ObjectPinType.canceledProject;
    }

    if (project.status === ProjectStatus.replanned) {
      return ObjectPinType.replannedProject;
    }

    if (project.status === ProjectStatus.planned) {
      return ObjectPinType.plannedProject;
    }
    if (project.status === ProjectStatus.postponed) {
      return ObjectPinType.postponedProject;
    }

    if (project.status === ProjectStatus.finalOrdered) {
      return ObjectPinType.finalOrderedProject;
    }

    if (project.status === ProjectStatus.programmed) {
      return ObjectPinType.programmedProject;
    }
    if (project.status === ProjectStatus.preliminaryOrdered) {
      return ObjectPinType.preliminaryOrderedProject;
    }
    if (interval.presentProjects.length || interval.multipleYearsProjects.length) {
      return ObjectPinType.presentProject;
    }
  }

  private onGlobalFilterChanges(previousFilter: IGlobalFilter, currentFilter: IGlobalFilter): void {
    this.projectsShown = this.globalFilterService.isElementShown(GlobalFilterShownElement.projects);
    this.projectsReload =
      this.projectsShown &&
      this.globalFilterService.hasFilterChanged(previousFilter, currentFilter, PROJECTS_KEYS, [
        GlobalFilterShownElement.projects
      ]);
    if (this.projectsReload) {
      this.patchFilter({
        boroughId: currentFilter.boroughs,
        categoryId: currentFilter.projectCategories,
        executorId: currentFilter.executors,
        fromBudget: currentFilter.budgetFrom,
        inChargeId: currentFilter.requestors,
        medalId: currentFilter.medals,
        interventionProgramId: currentFilter.programTypes,
        programBookId: currentFilter.programBooks,
        submissionNumber: currentFilter.submissionNumber,
        projectTypeId: currentFilter.projectTypes,
        status: currentFilter.projectStatuses,
        subCategoryId: currentFilter.projectSubCategories,
        toBudget: currentFilter.budgetTo,
        workTypeId: currentFilter.workTypes
      });
    }
  }

  public searchProjectArea(geometries: IGeometry[]): Promise<IGeometry> {
    return this.http
      .post<IGeometry>(`${environment.apis.planning.search}/work-area?type=project`, geometries)
      .toPromise();
  }

  public addInterventionsToProjectPni(projects: IEnrichedProject[]): Observable<IEnrichedProject[]> {
    const pniProjects = projects.filter(p => p.projectTypeId === ProjectType.nonIntegrated);
    const nonPniProjects = projects.filter(p => p.projectTypeId !== ProjectType.nonIntegrated);
    const pniProjectsInterventionIds: string[] = pniProjects.map(p => p.interventionIds.find(i => i));

    if (pniProjectsInterventionIds.length) {
      return this.interventionService
        .searchInterventionsPost({
          id: pniProjectsInterventionIds,
          fields: ['programId']
        })
        .pipe(
          map(pniInterventions => {
            const newPniProjects = pniProjects.map(pr => {
              pr.interventions = pniInterventions.filter(el => pr.interventionIds.includes(el.id));
              return pr;
            });
            return [...newPniProjects, ...nonPniProjects];
          })
        );
    }
    return of(projects);
  }
}

import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import {
  ICountBy,
  IPaginatedRtuProjects,
  IRtuProject,
  IRtuProjectSearchRequest,
  ITaxonomyList,
  Permission,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { assign, cloneDeep, isArray, isEmpty, isEqual, isNil, omitBy, pick, pickBy } from 'lodash';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { distinctUntilChanged, map, startWith, take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { ObjectPinType } from '../../map/config/layers/map-enums';
import { buildHttpParams } from '../http/params-builder';
import { IGlobalFilter, RTU_PROJECTS_KEYS } from '../models/filters/global-filter';
import { GlobalFilterShownElement } from '../models/filters/global-filter-shown-element';
import { RtuProjectCategory } from '../models/rtu-project-category';
import { IRtuProjectCriteria } from '../models/rtu-project-criteria';
import { IRtuProjectIntervals } from '../models/rtu-project-intervals';
import { TimeInterval } from '../models/time-interval.ts';
import { UserService } from '../user/user.service';
import { Utils } from '../utils/utils';
import { GlobalFilterService } from './filters/global-filter.service';
import { ProjectService } from './project.service';
import { TaxonomiesService } from './taxonomies.service';

interface IYears {
  startYear: number;
  endYear: number;
}

interface IYearDates {
  firstDate: string;
  lastDate: string;
}

export interface IRtuPartnerByCategory {
  partner: string[];
  city: string[];
  borough: string[];
}

@Injectable({
  providedIn: 'root'
})
export class RtuProjectService {
  private readonly rtuFilterSubject = new BehaviorSubject<IRtuProjectCriteria>({});
  public readonly rtuFilter$ = this.rtuFilterSubject.asObservable();
  public get rtuProjectFilter(): IRtuProjectCriteria {
    return this.rtuFilterSubject.getValue();
  }
  public set rtuProjectFilter(filter: IRtuProjectCriteria) {
    this.rtuFilterSubject.next(filter);
  }

  public get partnerProjectsShown$(): Observable<boolean> {
    return this.rtuProjectFilters$.pipe(
      map(
        el =>
          this.isPartnerProjectReadable &&
          this.globalFilterService.isElementShown(GlobalFilterShownElement.partnerProjects)
      )
    );
  }

  public get linkedCityProjectsShown$(): Observable<boolean> {
    return this.rtuProjectFilters$.pipe(
      map(el => this.globalFilterService.isElementShown(GlobalFilterShownElement.linkedCityProjects))
    );
  }

  public get boroughProjects$(): Observable<boolean> {
    return this.rtuProjectFilters$.pipe(
      map(el => this.globalFilterService.isElementShown(GlobalFilterShownElement.boroughProjects))
    );
  }
  public get partnerProjectsShown(): boolean {
    return (
      this.isPartnerProjectReadable && this.globalFilterService.isElementShown(GlobalFilterShownElement.partnerProjects)
    );
  }

  public get linkedCityProjectsShown(): boolean {
    return this.globalFilterService.isElementShown(GlobalFilterShownElement.linkedCityProjects);
  }
  public get boroughProjectsShown(): boolean {
    return this.globalFilterService.isElementShown(GlobalFilterShownElement.boroughProjects);
  }

  public get rtuProjectsReload$(): Observable<boolean> {
    return this.rtuProjectFilters$.pipe(
      map(filter => {
        return this.boroughProjectsShown || this.partnerProjectsShown || this.linkedCityProjectsShown;
      })
    );
  }

  private rtuPartnerByCategory: IRtuPartnerByCategory;
  private isPartnerProjectReadable: boolean;
  private _canReadRtuProjects = false;

  public get canReadRtuProjects(): boolean {
    return this._canReadRtuProjects;
  }

  constructor(
    private readonly projectService: ProjectService,
    private readonly http: HttpClient,
    private readonly globalFilterService: GlobalFilterService,
    private readonly taxonomiesService: TaxonomiesService,
    private readonly userService: UserService
  ) {
    this.rtuProjectFilters$
      .pipe(
        startWith(null),
        distinctUntilChanged((prev, curr) => isEqual(prev, curr))
      )
      .subscribe(async filter => {
        await this.initTaxonomies();
        this.isPartnerProjectReadable = await this.userService.hasPermission(Permission.PARTNER_PROJECT_READ);
        this.onGlobalFilterChanges(filter);
      });
    this.userService
      .hasPermission(Permission.RTU_PROJECT_READ)
      .then(canReadRtuProjects => {
        this._canReadRtuProjects = canReadRtuProjects;
      })
      .catch(() => undefined);
  }

  public getRtuProjectsYears(projectList: IRtuProject[], year?: number): IRtuProjectIntervals {
    if (year) {
      this.projectService.fromYear = year;
    }
    const intervals: IRtuProjectIntervals = {
      pastProjects: [],
      presentProjects: [],
      futureProjects: []
    }; // Initialize the arrays
    for (const rtuProject of projectList) {
      if (this.isRtuProjectPast(rtuProject)) {
        intervals.pastProjects.push(rtuProject);
      } else if (this.isRtuProjectPresent(rtuProject)) {
        intervals.presentProjects.push(rtuProject);
      } else if (this.isRtuProjectFuture(rtuProject)) {
        intervals.futureProjects.push(rtuProject);
      }
    }
    return intervals;
  }

  public getRtuProjectColor(rtuProject: IRtuProject): string {
    if (!rtuProject) {
      return '';
    }
    if (this.isRtuProjectPresent(rtuProject)) {
      return TimeInterval.present;
    }
    if (this.isRtuProjectPast(rtuProject)) {
      return TimeInterval.past;
    }
    if (this.isRtuProjectFuture(rtuProject)) {
      return TimeInterval.future;
    }
    return '';
  }

  private isRtuProjectPresent(project: IRtuProject): boolean {
    const years = this.getRtuProjectYears(project);
    return years.startYear <= this.projectService.fromYear && this.projectService.fromYear <= years.endYear;
  }

  private isRtuProjectPast(project: IRtuProject): boolean {
    const years = this.getRtuProjectYears(project);
    return years.endYear < this.projectService.fromYear;
  }

  private isRtuProjectFuture(project: IRtuProject): boolean {
    const years = this.getRtuProjectYears(project);
    return this.projectService.fromYear < years.startYear;
  }

  private getRtuProjectYears(rtuProject: IRtuProject): IYears {
    return {
      startYear: new Date(rtuProject.dateStart).getFullYear(),
      endYear: new Date(rtuProject.dateEnd).getFullYear()
    };
  }

  private async initTaxonomies(): Promise<void> {
    if (this.rtuPartnerByCategory) {
      return;
    }
    const partnerTaxonomy = await this.taxonomiesService
      .group(TaxonomyGroup.infoRtuPartner)
      .pipe(take(1))
      .toPromise();
    this.rtuPartnerByCategory = this.getPartnerIdsByCategory(partnerTaxonomy);
  }

  public getRtuProjectPins(rtuProjects: IRtuProject[]): turf.Feature<turf.Point>[] {
    return rtuProjects
      ?.filter(p => p.geometryPin)
      .map(p => {
        const point = turf.point(p.geometryPin);
        point.properties = this.getRtuProjectFeatureProperties(p);
        return point;
      });
  }

  public getRtuProjectsAreas(rtuProjects: IRtuProject[]): turf.Feature<turf.Polygon>[] {
    return rtuProjects
      ?.filter(p => p.geometry)
      .map(p => {
        const f = turf.feature(p.geometry as turf.Polygon);
        f.properties = this.getRtuProjectFeatureProperties(p);
        return f;
      });
  }

  public getRtuProjects(filters?: IRtuProjectCriteria): Observable<IPaginatedRtuProjects> {
    if (!this.canReadRtuProjects) {
      return of({ items: [] });
    }
    Utils.removeObjectEmptyProperties(filters);

    const searchObj = { ...filters };
    this.updateSearchObjPartnerId(searchObj);

    const httpParams = searchObj ? buildHttpParams(searchObj) : undefined;
    return this.http.get<IPaginatedRtuProjects>(environment.apis.planning.rtuProjects, { params: httpParams });
  }

  public async getRtuProject(id: string): Promise<IRtuProject> {
    if (!this.canReadRtuProjects) {
      return null;
    }
    return this.http.get<IRtuProject>(`${environment.apis.planning.rtuProjects}/${id}`).toPromise();
  }

  public searchRtuProjects(searchRequest?: IRtuProjectSearchRequest): Observable<IPaginatedRtuProjects> {
    Utils.removeObjectEmptyProperties(searchRequest as IRtuProjectCriteria);
    return this.http.post<IPaginatedRtuProjects>(`${environment.apis.planning.rtuProjects}/search`, searchRequest);
  }

  public getCountByCity(partnerId?: string[]): Observable<ICountBy[]> {
    if (!this.canReadRtuProjects || (isArray(partnerId) && partnerId?.length === 0)) {
      return of([]);
    }
    const searchObj = { ...this.rtuFilterSubject.value, partnerId, countBy: 'areaId' };
    const httpParams = searchObj ? buildHttpParams(searchObj) : undefined;
    return this.http.get<ICountBy[]>(environment.apis.planning.rtuProjects + '/countBy', { params: httpParams });
  }

  private updateSearchObjPartnerId(searchObj: IRtuProjectCriteria): void {
    if (this.isPartnerProjectReadable || !isEmpty(searchObj.partnerId)) {
      return;
    }
    searchObj.partnerId = [...this.rtuPartnerByCategory.borough, ...this.rtuPartnerByCategory.city];
  }

  private getRtuProjectFeatureProperties(rtuProject: IRtuProject): any {
    return {
      _highlighted: true,
      id: rtuProject.id,
      rtuProject,
      type: this.getRtuProjectFeaturePinType(rtuProject)
    };
  }

  private getRtuProjectFeaturePinType(rtuProject: IRtuProject): string {
    const interval = this.getRtuProjectsYears([rtuProject]);
    if (interval.futureProjects.length) {
      return ObjectPinType.futureRtuProject;
    }
    if (interval.pastProjects.length) {
      return ObjectPinType.pastRtuProject;
    }
    if (interval.presentProjects.length) {
      return ObjectPinType.presentRtuProject;
    }
  }

  // use pick to get only filters of rtuProjects
  private get rtuProjectFilters$(): Observable<IGlobalFilter> {
    return this.globalFilterService.filter$.pipe(
      map(filter => {
        // remove null filters
        const newFilter = omitBy(filter, isNil);
        const x = { ...this.defaultFilter, ...pick(newFilter, RTU_PROJECTS_KEYS) };
        return x;
      })
    );
  }

  private get defaultFilter(): IGlobalFilter {
    return pick(this.globalFilterService.defaultFilter, RTU_PROJECTS_KEYS);
  }

  // tslint:disable-next-line:cyclomatic-complexity
  private onGlobalFilterChanges(filter: IGlobalFilter): void {
    const partnerId: string[] = [];

    if (this.linkedCityProjectsShown) {
      partnerId.push(...this.rtuPartnerByCategory.city);
    }
    if (this.boroughProjectsShown) {
      partnerId.push(...this.rtuPartnerByCategory.borough);
    }
    if (this.partnerProjectsShown) {
      if (filter?.partnerId?.length) {
        partnerId.push(...filter.partnerId);
      } else {
        partnerId.push(...this.rtuPartnerByCategory.partner);
      }
    }
    this.patchFilter({
      areaId: filter?.boroughs,
      partnerId,
      rtuStatus: filter?.rtuProjectStatuses?.join(',')
    });
  }

  public patchFilter(value: IRtuProjectCriteria): void {
    this.rtuProjectFilter = assign(cloneDeep(this.rtuProjectFilter), value);
  }

  public getPartnerIdsByCategory(taxonomies: ITaxonomyList): IRtuPartnerByCategory {
    return {
      borough: this.getTaxonomiesByCategory(taxonomies, RtuProjectCategory.borough),
      city: this.getTaxonomiesByCategory(taxonomies, RtuProjectCategory.city),
      partner: this.getTaxonomiesByCategory(taxonomies, RtuProjectCategory.partner)
    };
  }

  private getTaxonomiesByCategory(taxonomies: ITaxonomyList, category: RtuProjectCategory): string[] {
    return taxonomies.filter(t => t.properties?.category === category).map(x => x.code);
  }
}

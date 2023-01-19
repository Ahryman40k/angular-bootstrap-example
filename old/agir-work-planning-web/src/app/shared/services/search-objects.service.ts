import { Injectable } from '@angular/core';
import {
  IAsset,
  IAssetList,
  IEnrichedIntervention,
  IEnrichedProject,
  IInterventionPaginatedSearchRequest,
  IInterventionSearchRequest,
  IProjectPaginatedSearchRequest,
  IProjectSearchRequest,
  IRtuProject
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { combineLatest, from, Observable, of, Subject } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import { IAddressFull } from '../models/location/address-full';
import { ObjectType } from '../models/object-type/object-type';
import { AssetService } from './asset.service';
import { InterventionService } from './intervention.service';
import { LocationService, uniqueKeyBuilders } from './location.service';
import { ProjectService } from './project.service';

export type SearchObjectResults = [IEnrichedProject[], IAddressFull[], IEnrichedIntervention[], IAssetList];
const SEARCH_TERM_MIN_LENGTH = 2;
const SEARCH_PROJECT_FIELDS_PARAMS = [
  'boroughId',
  'projectName',
  'projectTypeId',
  'submissionNumber',
  'drmNumber',
  'interventionIds',
  'globalBudget',
  'annualDistribution.annualPeriods',
  'executorId',
  'status',
  'startYear',
  'streetName',
  'geometryPin'
];
const SEARCH_INTERVENTION_FIELDS_PARAMS = [
  'boroughId',
  'interventionName',
  'interventionTypeId',
  'programId',
  'executorId',
  'requestorId',
  'estimate',
  'assets',
  'interventionArea',
  'interventionYear',
  'status',
  'streetName'
];

export interface ISearchObjectsRequest {
  term: string;
  limit: number;
  submissionNumber?: string;
  defaultInterventionSearchRequest?: IInterventionSearchRequest;
  defaultProjectSearchRequest?: IProjectSearchRequest;
  options?: { disabledObjectTypes?: ObjectType[]; filter?: (results: any[]) => any[] };
}

@Injectable({ providedIn: 'root' })
export class SearchObjectsService {
  private readonly termSubject = new Subject<string>();
  public readonly term$ = this.termSubject.asObservable();

  constructor(
    private readonly projectService: ProjectService,
    private readonly locationService: LocationService,
    private readonly interventionService: InterventionService,
    private readonly assetService: AssetService
  ) {}

  public setTerm(term: string): void {
    this.termSubject.next(term);
  }

  public isSearchTermValid(term: string): boolean {
    return !!term && term.length >= SEARCH_TERM_MIN_LENGTH;
  }

  public searchObjects(searchRequest: ISearchObjectsRequest): Observable<SearchObjectResults> {
    if (!this.isSearchTermValid(searchRequest?.term)) {
      return of([[], [], [], []]);
    }
    return combineLatest(
      this.searchProjects(searchRequest),
      this.searchLocations(searchRequest),
      this.searchInterventions(searchRequest),
      this.searchAssets(searchRequest)
    ).pipe(map(results => this.tryFilterResults(results, searchRequest)));
  }

  public getResultType(result: any, term?: string): ObjectType {
    const project = result as IEnrichedProject;
    if (project.projectTypeId) {
      return this.projectObjectType(project, term);
    }
    const rtuProject = result as IRtuProject;
    if (rtuProject && rtuProject.partnerId) {
      return ObjectType.rtuProject;
    }
    const address = result as IAddressFull;
    if (address && address.street) {
      return ObjectType.address;
    }
    const intervention = result as IEnrichedIntervention;
    if (intervention && intervention.interventionTypeId) {
      return ObjectType.intervention;
    }
    const asset = result as IAsset;
    if (asset && asset.ownerId && asset.typeId) {
      return ObjectType.asset;
    }
    return null;
  }

  private projectObjectType(project: IEnrichedProject, term: string): ObjectType {
    let numericTerm = term?.replace(/\D/g, '');
    numericTerm = /^\d{4}(00)$/.test(numericTerm) ? numericTerm.substr(0, 4) : numericTerm;
    if (term && (project.drmNumber?.includes(numericTerm) || project.submissionNumber?.includes(numericTerm))) {
      return ObjectType.submissionNumber;
    }

    return ObjectType.project;
  }

  private searchProjects(searchRequest: ISearchObjectsRequest): Observable<IEnrichedProject[]> {
    if (this.isObjectTypeDisabled(searchRequest, ObjectType.project)) {
      return of([]);
    }
    const filter: IProjectPaginatedSearchRequest = {
      q: searchRequest?.term,
      limit: searchRequest?.limit,
      submissionNumber: searchRequest?.submissionNumber,
      bbox: null,
      fields: SEARCH_PROJECT_FIELDS_PARAMS.join(','),
      ...searchRequest.defaultProjectSearchRequest
    };
    return combineLatest(this.projectService.filter$, this.projectService.projectsShown$).pipe(
      switchMap(() => from(this.projectService.getProjects(filter))),
      map(x => x.items || [])
    );
  }

  private searchInterventions(searchRequest: ISearchObjectsRequest): Observable<IEnrichedIntervention[]> {
    if (this.isObjectTypeDisabled(searchRequest, ObjectType.intervention)) {
      return of([]);
    }
    const filter: IInterventionPaginatedSearchRequest = {
      q: searchRequest?.term,
      limit: searchRequest?.limit,
      interventionAreaBbox: null,
      fields: SEARCH_INTERVENTION_FIELDS_PARAMS.join(','),
      ...searchRequest.defaultInterventionSearchRequest
    };
    return combineLatest(this.interventionService.filter$, this.interventionService.interventionsShown$).pipe(
      switchMap(() => from(this.interventionService.getInterventions(filter))),
      map(x => x.items || [])
    );
  }

  private searchLocations(searchRequest: ISearchObjectsRequest): Observable<IAddressFull[]> {
    if (this.isObjectTypeDisabled(searchRequest, ObjectType.address)) {
      return of([]);
    }

    return this.locationService
      .searchAddresses(
        { q: searchRequest?.term, limit: searchRequest?.limit },
        { uniqueKeyBuilder: uniqueKeyBuilders.default, sortBy: a => a.street.fullStreetName.nameFr }
      )
      .pipe(map(paginatedAddresses => paginatedAddresses.items));
  }

  private searchAssets(searchRequest: ISearchObjectsRequest): Observable<IAssetList> {
    if (!this.canSearchAssets(searchRequest)) {
      return of([]);
    }

    const assets = this.assetService.searchAssets({ id: searchRequest?.term });
    return from(assets);
  }

  private canSearchAssets(searchRequest: ISearchObjectsRequest): boolean {
    return !this.isObjectTypeDisabled(searchRequest, ObjectType.asset) && /^\d+$/.test(searchRequest.term);
  }

  private isObjectTypeDisabled(searchRequest: ISearchObjectsRequest, objectType: ObjectType): boolean {
    return searchRequest.options?.disabledObjectTypes?.includes(objectType);
  }

  private tryFilterResults(results: SearchObjectResults, searchRequest: ISearchObjectsRequest): SearchObjectResults {
    if (searchRequest.options?.filter) {
      for (let i = 0; i < results.length; i++) {
        results[i] = searchRequest.options.filter(results[i]);
      }
    }
    return results;
  }
}

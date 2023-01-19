import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as turf from '@turf/turf';
import {
  AnnualProgramExpand,
  IAssetList,
  IEnrichedIntervention,
  IEnrichedProject
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, orderBy } from 'lodash';
import { combineLatest, Observable, of } from 'rxjs';
import { shareReplay, switchMap, takeUntil, tap } from 'rxjs/operators';
import { BaseComponent } from 'src/app/shared/components/base/base.component';
import { IAddressFull } from 'src/app/shared/models/location/address-full';
import { ObjectType } from 'src/app/shared/models/object-type/object-type';
import { AnnualProgramService } from 'src/app/shared/services/annual-program.service';
import { AssetService } from 'src/app/shared/services/asset.service';
import { InterventionService } from 'src/app/shared/services/intervention.service';
import { LocationService } from 'src/app/shared/services/location.service';
import { MapDataService } from 'src/app/shared/services/map-data.service';
import { MapNavigationService, MapOutlet } from 'src/app/shared/services/map-navigation.service';
import { MapService } from 'src/app/shared/services/map.service';
import { ProjectService } from 'src/app/shared/services/project.service';
import { SearchObjectResults, SearchObjectsService } from 'src/app/shared/services/search-objects.service';

import { defaultAnnualProgramFields } from '../../program-book/program-book-fields';
import { MapSourceId, MapSourceService } from '../../shared/services/map-source.service';

const SEARCH_RESULTS_MAX_LENGTH = 100;

@Component({
  selector: 'app-map-search-results',
  templateUrl: './map-search-results.component.html',
  styleUrls: ['./map-search-results.component.scss']
})
export class MapSearchResultsComponent extends BaseComponent implements OnInit, OnDestroy {
  public projects: IEnrichedProject[];
  public interventions: IEnrichedIntervention[];
  public addresses: IAddressFull[];
  public assets: IAssetList;
  public allItemsLength: number;

  public get projectsShown(): boolean {
    return this.projectService.projectsShown;
  }

  public get interventionsShown(): boolean {
    return this.interventionService.interventionsShown;
  }

  constructor(
    private readonly route: ActivatedRoute,
    private readonly mapService: MapService,
    private readonly mapSourceService: MapSourceService,
    private readonly mapNavigationService: MapNavigationService,
    private readonly mapDataService: MapDataService,
    private readonly searchObjectsService: SearchObjectsService,
    private readonly locationService: LocationService,
    private readonly projectService: ProjectService,
    private readonly interventionService: InterventionService,
    private readonly assetService: AssetService,
    private readonly annualProgramService: AnnualProgramService
  ) {
    super();
  }

  public ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.searchObjectsService.setTerm(params.q);
    });
    combineLatest(this.route.params, this.mapService.mapLoaded$)
      .pipe(
        takeUntil(this.destroy$),
        tap(() => this.initMapConfig()),
        switchMap(([params]) => this.searchObjects(params.q)),
        takeUntil(this.destroy$), // It's important to check for destroy a second time.
        shareReplay()
      )
      .subscribe(results => {
        this.initResults(results);
        this.initResultsOnMap();
      });
  }

  private initMapConfig(): void {
    this.mapDataService.setEmpty();
  }

  private initResults(searchResults: SearchObjectResults): void {
    const allItems = flatten(searchResults as any[][]);
    if (allItems.length === 1) {
      void this.mapNavigationService.navigateToSelection(allItems[0]);
      return;
    }
    this.allItemsLength = allItems.length;

    const [projects, addresses, interventions, assets] = searchResults;
    this.projects = orderBy(projects, p => p.startYear);
    this.projectService.addInterventionsToProjectPni(this.projects);
    if (this.projects.length) {
      this.annualProgramService
        .getCachedAnnualPrograms(defaultAnnualProgramFields, [AnnualProgramExpand.programBooks])
        .then()
        .catch(() => undefined);
    }
    this.addresses = addresses;
    this.interventions = orderBy(interventions, i => i.planificationYear);
    this.assets = assets;
  }

  private initResultsOnMap(): void {
    this.mapDataService.setInterventions(of(this.interventions));
    this.mapDataService.setProjects(of(this.projects));
    this.mapSourceService.setSource(MapSourceId.addressesPins, this.locationService.getAddressFeatures(this.addresses));
    const bboxPolygon = this.getResultsBboxPolygon();
    if (bboxPolygon) {
      this.mapService.fitZoomToGeometry(bboxPolygon);
    }
  }

  private searchObjects(term: string): Observable<SearchObjectResults> {
    // TODO: Remove this line to enable the assets search. Find "after mise en prod" for it's usage.
    const options = { disabledObjectTypes: [ObjectType.asset] };

    return this.searchObjectsService.searchObjects({
      limit: SEARCH_RESULTS_MAX_LENGTH,
      term,
      options
    });
  }

  private getResultsBboxPolygon(): turf.Polygon {
    const projectFeatures = this.projectService.getProjectPins(this.projects) || [];
    const addressFeatures = this.locationService.getAddressFeatures(this.addresses) || [];
    const interventionFeatures = this.interventionService.getInterventionPins(this.interventions) || [];
    const assetFeatures = this.assetService.getAssetFeatures(this.assets);
    const features = [...projectFeatures, ...addressFeatures, ...interventionFeatures, ...assetFeatures];
    if (!features.length) {
      return null;
    }
    const collection = turf.featureCollection(features);
    return turf.bboxPolygon(turf.bbox(collection)).geometry;
  }

  public navigateToSelection(id: string): void {
    void this.mapNavigationService.navigateTo(MapOutlet.rightPanel, ['selection', 'projects', id]);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.mapDataService.setDefault();
    this.mapSourceService.setSource(MapSourceId.addressesPins, []);
    this.searchObjectsService.setTerm('');
  }
}

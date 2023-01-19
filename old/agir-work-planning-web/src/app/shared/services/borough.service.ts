import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ICountBy, ITaxonomy, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { orderBy } from 'lodash';
import { combineLatest, Observable, zip } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { mapStyleConfig } from 'src/app/map/config/layers/styles';

import { boroughFeatures } from '../boroughs/features';
import { BoroughCountFeature } from '../models/borough/borough-count-feature';
import { ICountByBoroughFeaturesArgs } from '../models/borough/count-by-borough-feature-args';
import { CityCountFeature } from '../models/city/city-count-feature';
import { ICountByCityFeaturesArgs } from '../models/city/count-by-city-feature-args';
import { IGlobalFilter } from '../models/filters/global-filter';
import { PROJECT_FIELDS } from '../models/findOptions/projectFields';
import { GlobalFilterService } from './filters/global-filter.service';
import { InterventionService } from './intervention.service';
import { FitZoomToGeometryPadding, MapService } from './map.service';
import { ProjectService } from './project.service';
import { RtuProjectService } from './rtu-project.service';
import { TaxonomiesService } from './taxonomies.service';

@Injectable({ providedIn: 'root' })
export class BoroughService {
  constructor(
    private readonly interventionService: InterventionService,
    private readonly http: HttpClient,
    private readonly projectService: ProjectService,
    private readonly taxonomyService: TaxonomiesService,
    private readonly globalFilterService: GlobalFilterService,
    private readonly mapService: MapService,
    private readonly rtuProjectService: RtuProjectService
  ) {}

  public getCountByBoroughFeatures(): Observable<BoroughCountFeature[]> {
    return zip(
      this.interventionService.getCountByBorough(),
      this.projectService.getCountByBorough(),
      this.taxonomyService.group(TaxonomyGroup.borough).pipe(take(1)),
      this.globalFilterService.filter$.pipe(take(1))
    ).pipe(
      map(([interventionCounts, projectCounts, boroughTaxonomies, globalFilter]) => {
        const boroughsToShow = this.getBoroughsToShow(boroughTaxonomies, globalFilter);
        const featureCollection = boroughFeatures.getBoroughCentroids(boroughsToShow);
        const args: ICountByBoroughFeaturesArgs = {
          featureCollection,
          interventionCounts,
          projectCounts
        };
        return this.mapBoroughCountFeatures(args);
      })
    );
  }

  public getCountByCityFeatures(partnerIds?: string[]): Observable<CityCountFeature[]> {
    return zip(
      this.rtuProjectService.getCountByCity(partnerIds),
      this.taxonomyService.group(TaxonomyGroup.city).pipe(take(1)),
      this.globalFilterService.filter$.pipe(take(1))
    ).pipe(
      map(([rtuProjectCounts, cityTaxonomies]) => {
        const featureCollection = boroughFeatures.getCityCentroids(cityTaxonomies.map(t => t.code));
        const args: ICountByCityFeaturesArgs = {
          featureCollection,
          rtuProjectCounts
        };
        return this.mapCityCountFeatures(args);
      })
    );
  }

  public getCountByMedal(boroughId: string): Observable<ICountBy[]> {
    return combineLatest(
      this.taxonomyService.group(TaxonomyGroup.medalType),
      this.projectService.getMapCountBy({ countBy: PROJECT_FIELDS.MEDAL_ID, boroughId })
    ).pipe(
      map(([taxonomies, countBy]) => {
        const medals = orderBy(taxonomies, t => t.displayOrder, 'desc');
        return medals.map(m => {
          return { id: m.code, count: countBy.find(c => c.id === m.code)?.count || 0 };
        });
      })
    );
  }

  public async zoomMapOnBoroughs(): Promise<void> {
    const boroughTaxonomies = await this.taxonomyService
      .group(TaxonomyGroup.borough)
      .pipe(take(1))
      .toPromise();
    const boroughsToShow = this.getBoroughsToShow(boroughTaxonomies, this.globalFilterService.filter);
    const featureCollection = boroughFeatures.getBoroughCentroids(boroughsToShow);

    this.mapService.fitZoomToGeometry(
      featureCollection,
      FitZoomToGeometryPadding.LARGE,
      true,
      mapStyleConfig.boroughCount.maxZoom - 0.1
    );
  }

  private mapBoroughCountFeatures(args: ICountByBoroughFeaturesArgs): BoroughCountFeature[] {
    return args.featureCollection.features.map(f => this.mapBoroughCountFeature(f, args)).filter(f => f);
  }

  private mapBoroughCountFeature(feature: BoroughCountFeature, args: ICountByBoroughFeaturesArgs): BoroughCountFeature {
    const projectCount = this.getCountById(args.projectCounts, feature.properties.ABREV);
    const interventionCount = this.getCountById(args.interventionCounts, feature.properties.ABREV);
    const totalCount = (projectCount?.count || 0) + (interventionCount?.count || 0);

    feature.properties.displayCount = totalCount;
    feature.properties.projectCount = projectCount;
    feature.properties.interventionCount = interventionCount;

    return feature;
  }

  private mapCityCountFeatures(args: ICountByCityFeaturesArgs): CityCountFeature[] {
    return args.featureCollection.features.map(f => this.mapCityCountFeature(f, args)).filter(f => f);
  }

  private mapCityCountFeature(feature: CityCountFeature, args: ICountByCityFeaturesArgs): CityCountFeature {
    const rtuProjectCount = this.getCountById(args.rtuProjectCounts, feature.properties.ABREV);

    feature.properties.displayCount = rtuProjectCount?.count || 0;

    return feature;
  }

  /**
   * Gets the boroughs to display on the map.
   * If a filter is applied we only show the boroughs that are filtered.
   * Otherwise we display the boroughs from the taxonomies.
   * @param boroughTaxonomies The borough taxonomies
   * @param globalFilter The current applied global filter
   */
  private getBoroughsToShow(boroughTaxonomies: ITaxonomy[], globalFilter: IGlobalFilter): string[] {
    if (globalFilter.boroughs?.length) {
      return globalFilter.boroughs;
    }
    return boroughTaxonomies.map(t => t.code);
  }

  private getCountById(countsBy: ICountBy[], id: string): ICountBy {
    return countsBy.find(x => x.id === id);
  }
}

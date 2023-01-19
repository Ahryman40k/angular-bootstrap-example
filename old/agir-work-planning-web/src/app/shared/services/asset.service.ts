import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import {
  AssetType,
  IAsset,
  IAssetLastIntervention,
  IAssetList,
  IAssetsLastInterventionSearchRequest,
  IAssetsWorkArea,
  IAssetsWorkAreaSearchRequest,
  IEnrichedIntervention,
  IGeometry,
  ISearchAssetsRequest,
  ITaxonomyAssetType,
  ITaxonomyList,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib';
import { cloneDeep, flatten, includes, isEmpty, isNil, uniq } from 'lodash';
import { MapboxGeoJSONFeature } from 'mapbox-gl';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, map, retry, take } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { assetLogicLayerGroups } from '../../map/config/layers/asset-logic-layer-groups';
import { ISelectedAsset } from '../components/asset-list/asset-list.component';
import { IAssetTypeIdPair } from '../models/assets/asset-type-id-pair';
import { ExternalReferenceIdType, NexoService } from './nexo.service';
import { ProjectService } from './project.service';
import { TaxonomiesService } from './taxonomies.service';
import { TaxonomyAssetService } from './taxonomy-asset.service';

const INSTALLATION_DATE_PROPERTY = 'installationDate';
export const roadwayAssetTypes = [AssetType.roadway, AssetType.roadwayIslands, AssetType['roadway-intersection']];

export interface IAssetGroup {
  type: AssetType;
  ids: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private readonly selectedAssetsSubject = new BehaviorSubject<ISelectedAsset[]>([]);
  public selectedAssets$ = this.selectedAssetsSubject.asObservable();
  constructor(
    private readonly http: HttpClient,
    private readonly taxonomyService: TaxonomiesService,
    private readonly taxonomyAssetService: TaxonomyAssetService,
    private readonly projectService: ProjectService
  ) {}

  public setSelectedAssets(assets: ISelectedAsset[]): void {
    this.selectedAssetsSubject.next(assets);
  }

  public get(assetType: AssetType | string, id: string, expands?: string[]): Promise<IAsset> {
    let params: HttpParams | { [param: string]: string | string[] };
    if (expands && expands.length) {
      params = { expand: expands.join(',') };
    }
    return this.http
      .get<IAsset>(`${environment.apis.planning.assets}/${assetType}/${id}`, { params })
      .toPromise();
  }

  public getAllInGeometry(geometry: IGeometry): Promise<IAsset[]> {
    return this.searchAssets({ geometry, advancedIntersect: true });
  }

  /**
   * @param  {string} typeId
   * @returns AssetType
   */
  public getAssetTypeFromTypeId(typeId: string): AssetType {
    return roadwayAssetTypes.includes(typeId as AssetType) ? AssetType.roadway : (typeId as AssetType);
  }

  public async searchAssets(searchAssetParams: ISearchAssetsRequest): Promise<IAsset[]> {
    const chunkSize = 3;
    let assetTypes = searchAssetParams.assetTypes ? searchAssetParams.assetTypes : await this.getEnabledAssetTypes();
    assetTypes = assetTypes.filter(asset => !includes(['unifiedSection', 'roadNetworkArterial'], asset));

    const searchAssetRequests = assetTypes
      .map((_, i) => {
        if (i % chunkSize !== 0) {
          return null;
        }

        const assetTypesChunk = assetTypes.slice(i, i + chunkSize);
        searchAssetParams.assetTypes = assetTypesChunk;
        return this.http
          .post<IAsset[]>(`${environment.apis.planning.assets}/search`, cloneDeep(searchAssetParams))
          .pipe(
            retry(2),
            catchError(() => of([]))
          );
      })
      .filter(request => request);

    return forkJoin(searchAssetRequests)
      .pipe(map(assets => flatten(assets)))
      .toPromise();
  }

  public searchAssetsWorkArea(searchRequest: IAssetsWorkAreaSearchRequest): Promise<IAssetsWorkArea> {
    return this.http
      .post<IAssetsWorkArea>(environment.apis.planning.search + '/assets/work-area', searchRequest)
      .toPromise();
  }

  public async getAssetTypeAndIdFromAssetFeature(assetFeature: MapboxGeoJSONFeature): Promise<IAssetTypeIdPair> {
    const sourceLayerId = assetFeature.layer['source-layer'];
    const assetTaxonomy = await this.taxonomyAssetService
      .getTaxonomyAssetFromSourceLayerId(sourceLayerId)
      .pipe(take(1))
      .toPromise();
    const id = assetTaxonomy ? assetFeature.properties[assetTaxonomy.properties.idKey] : assetFeature?.properties?.id;
    return { assetType: assetTaxonomy?.code as AssetType, assetId: id };
  }

  private async getEnabledAssetTypes(): Promise<string[]> {
    const enabledLogicLayerIds = await this.taxonomyService
      .group(TaxonomyGroup.mapAssetLogicLayer)
      .pipe(
        take(1),
        map(taxonomies => taxonomies.map(x => x.code))
      )
      .toPromise();
    const assetTypeTaxonomies = await this.getActiveAssets().toPromise();
    const enabledAssetTypes: string[] = [];
    for (const key in assetLogicLayerGroups) {
      if (!assetLogicLayerGroups.hasOwnProperty(key) || !enabledLogicLayerIds.includes(key)) {
        continue;
      }
      const assetsLayerGroup = assetLogicLayerGroups[key];
      const sourceLayers = assetsLayerGroup.map(x => x['source-layer']);
      enabledAssetTypes.push(
        ...assetTypeTaxonomies.filter(t => sourceLayers.includes(t.properties.sourcesLayerId)).map(t => t.code)
      );
    }
    return uniq(enabledAssetTypes);
  }

  public getAssetFeatures(assets: IAssetList): turf.Feature[] {
    return assets?.map(a => turf.feature(a?.geometry)) || [];
  }

  /**
   * @returns {ITaxonomyAssetType[]} this method returns assetTypes that are not consultation only and have sourceLayerId
   * we apply this filter because other assetTypes are not used to create interventions
   */
  public getActiveAssets(): Observable<ITaxonomyAssetType[]> {
    return this.taxonomyService.group(TaxonomyGroup.assetType).pipe(
      take(1),
      map(assetTypes => {
        return (assetTypes as ITaxonomyAssetType[]).filter(
          el => !el.properties.consultationOnly && !isNil(el.properties.sourcesLayerId)
        );
      })
    );
  }

  public async getAssetsLastIntervention(
    assetsLastInterventionSearchRequest: IAssetsLastInterventionSearchRequest
  ): Promise<IAssetLastIntervention[]> {
    return this.http
      .post<IAssetLastIntervention[]>(
        `${environment.apis.planning.assets}/search/lastIntervention`,
        assetsLastInterventionSearchRequest
      )
      .toPromise();
  }

  public async getSelectedAssetsFromAssets(
    assets: IAssetList,
    assetDataKeys: ITaxonomyList
  ): Promise<ISelectedAsset[]> {
    const assetsLastInterventions = await this.getAssetsLastInterventions(assets);
    const selectedAssets: ISelectedAsset[] = [];
    assets.forEach(asset => {
      let assetId = null;
      let geometry = null;
      let installationDate: Date;
      const lastIntervention = assetsLastInterventions.find(
        assetLastIntervention => assetLastIntervention.assetId === asset.id
      )?.intervention;
      const assetDataKey = assetDataKeys.find(dataKey => dataKey.code === INSTALLATION_DATE_PROPERTY);
      const assetKey = assetDataKey?.properties?.assetKey;
      if (assetKey && (asset as any).properties && (asset as any).properties[assetKey]) {
        installationDate = new Date((asset as any).properties[assetKey]);
      }

      const externalReferenceId = NexoService.getExternalReferenceIdByTypes(asset, [
        ExternalReferenceIdType.nexoAssetId,
        ExternalReferenceIdType.nexoReferenceNumber
      ]);
      if (asset.id) {
        assetId = asset.id;
        geometry = null;
      } else if (externalReferenceId) {
        assetId = externalReferenceId;
        geometry = asset?.geometry;
      }

      const selectedAsset: ISelectedAsset = {
        asset,
        lastIntervention,
        installationDate,
        assetId,
        geometry
      };
      selectedAssets.push(selectedAsset);
    });
    return selectedAssets;
  }

  public getSelectedAssetsFromIntervention(intervention: IEnrichedIntervention): ISelectedAsset[] {
    return intervention.assets.map(asset => {
      let assetId = null;
      let geometry = null;
      const externalReferenceId = NexoService.getExternalReferenceIdByTypes(asset, [
        ExternalReferenceIdType.nexoAssetId,
        ExternalReferenceIdType.nexoReferenceNumber
      ]);

      if (asset.id) {
        assetId = asset.id;
        geometry = null;
      } else if (externalReferenceId) {
        assetId = externalReferenceId;
        geometry = asset?.geometry;
      }

      return {
        asset,
        installationDate: asset.properties?.installationDate,
        assetId,
        geometry
      };
    });
  }

  public isAssetIdValid(assetId: string): boolean {
    return assetId && assetId !== '0';
  }

  private async getAssetsLastInterventions(assets: IAsset[]): Promise<IAssetLastIntervention[]> {
    const assetIds = assets?.filter(asset => asset.id)?.map(asset => asset.id);
    if (isEmpty(assetIds)) {
      return [];
    }
    return this.getAssetsLastIntervention({
      assetIds,
      planificationYear: this.projectService.fromYear
    });
  }

  public getAssetGroupsFromInterventions(interventions: IEnrichedIntervention[]): IAssetGroup[] {
    const assetGroups = [];
    interventions.forEach(intervention => {
      const assetGroup = {
        type: intervention.assets[0].typeId,
        ids: intervention.assets.map(item => item.id).filter(item => !!item)
      };

      const groupIndex = assetGroups.findIndex(item => item.type === assetGroup.type);

      if (groupIndex >= 0) {
        assetGroups[groupIndex].ids.push(...assetGroup.ids);
      } else {
        assetGroups.push(assetGroup);
      }
    });
    return assetGroups;
  }
}

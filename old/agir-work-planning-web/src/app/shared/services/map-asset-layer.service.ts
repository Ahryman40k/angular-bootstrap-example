import { Injectable } from '@angular/core';
import { AssetType, IAsset, TaxonomyGroup } from '@villemontreal/agir-work-planning-lib/dist/src';
import { flatten, isEmpty, values } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { Layer } from 'mapbox-gl';
import { assetLogicLayerGroups } from '../../map/config/layers/asset-logic-layer-groups';
import { ExternalReferenceIdType, NexoService } from './nexo.service';
import { TaxonomiesService } from './taxonomies.service';
import { TaxonomyAssetService } from './taxonomy-asset.service';

@Injectable({ providedIn: 'root' })
export class MapAssetLayerService {
  constructor(
    private readonly taxonomyAssetService: TaxonomyAssetService,
    private readonly taxonomyService: TaxonomiesService
  ) {}

  public getSourceLayerIdFromAssetType(assetType: AssetType): Observable<string> {
    return this.taxonomyAssetService
      .getTaxonomyAsset(assetType)
      .pipe(map(taxonomyAssetType => taxonomyAssetType.properties.sourcesLayerId));
  }

  public getLogicLayerIdFromAssetType(assetType: AssetType): Observable<string> {
    return this.taxonomyAssetService.getTaxonomyAsset(assetType).pipe(
      map(taxonomyAssetType => {
        for (const key in assetLogicLayerGroups) {
          if (!assetLogicLayerGroups.hasOwnProperty(key)) {
            continue;
          }
          const value = assetLogicLayerGroups[key];
          if (value.some(x => x['source-layer'] === taxonomyAssetType.properties.sourcesLayerId)) {
            return key;
          }
        }
        return null;
      })
    );
  }

  public getAssetTypesFromLogicLayerId(logicLayerId: string): Observable<AssetType[]> {
    return combineLatest(this.taxonomyAssetService.getAllTaxonomyAssets(), this.getEnabledLogicLayerGroups()).pipe(
      map(([assetTypeTaxonomies, enabledLogicLayerGroups]) => {
        const sourceLayers = enabledLogicLayerGroups[logicLayerId].map(x => x['source-layer']);
        return assetTypeTaxonomies
          .filter(x => sourceLayers.includes(x.properties.sourcesLayerId))
          .map(x => x.code) as AssetType[];
      })
    );
  }

  public getEnabledLogicLayerGroups(): Observable<{ [key: string]: mapboxgl.Layer[] }> {
    return this.taxonomyService.group(TaxonomyGroup.mapAssetLogicLayer).pipe(
      map(taxonomies => {
        const enabledLogicLayerIds = taxonomies.map(x => x.code);
        const enabledLogicLayerGroups: { [key: string]: mapboxgl.Layer[] } = {};
        for (const key in assetLogicLayerGroups) {
          if (!assetLogicLayerGroups.hasOwnProperty(key) || !enabledLogicLayerIds.includes(key)) {
            continue;
          }
          enabledLogicLayerGroups[key] = assetLogicLayerGroups[key];
        }
        return enabledLogicLayerGroups;
      })
    );
  }

  public getEnabledLogicLayerIds(): Observable<string[]> {
    return this.taxonomyService.group(TaxonomyGroup.mapAssetLogicLayer).pipe(
      map(taxonomies => {
        const enabledLogicLayerIds = taxonomies.map(x => x.code);
        return enabledLogicLayerIds;
      })
    );
  }

  public getEnabledLayerIds(): Observable<string[]> {
    return this.getEnabledLogicLayerGroups().pipe(
      map(logicLayerGroup => {
        const layers = flatten(values(logicLayerGroup));
        return layers.map(layer => layer.id);
      })
    );
  }

  public getExternalAssetsIdsByLayerType(
    assets: IAsset[],
    referenceTypes: ExternalReferenceIdType[],
    externalLayer: Layer
  ): string[] {
    const assetType = externalLayer.metadata?.assetType;
    let assetWithExternalReference = assets.filter(a => NexoService.getExternalReferenceIdByTypes(a, referenceTypes));
    if (assetType) {
      assetWithExternalReference = assetWithExternalReference.filter(a => a.typeId === assetType);
    }
    let externalIds = assetWithExternalReference.map(a =>
      String(NexoService.getExternalReferenceIdByTypes(a, referenceTypes))
    );
    if (isEmpty(externalIds)) {
      externalIds = ['0'];
    }
    return externalIds;
  }
}

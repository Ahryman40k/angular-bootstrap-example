import { Injectable } from '@angular/core';
import {
  AssetType,
  IAsset,
  ITaxonomyAssetDataKey,
  ITaxonomyAssetType,
  TaxonomyGroup
} from '@villemontreal/agir-work-planning-lib/dist/src';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';

import { Utils } from '../utils/utils';
import { TaxonomiesService } from './taxonomies.service';

export interface IPropertie {
  code: string;
  value: string;
}
@Injectable({ providedIn: 'root' })
export class TaxonomyAssetService {
  public properties: IPropertie[] = [];
  protected destroySubject = new Subject();
  public readonly destroy$ = this.destroySubject.asObservable();
  constructor(private readonly taxonomyService: TaxonomiesService) {}
  public getTaxonomyAsset(assetType: AssetType): Observable<ITaxonomyAssetType> {
    return this.taxonomyService.code(TaxonomyGroup.assetType, assetType) as Observable<ITaxonomyAssetType>;
  }

  public getAllTaxonomyAssets(): Observable<ITaxonomyAssetType[]> {
    return this.taxonomyService.group(TaxonomyGroup.assetType).pipe(map(x => x as ITaxonomyAssetType[]));
  }

  public getTaxonomyAssetFromSourceLayerId(sourceLayerId: string): Observable<ITaxonomyAssetType> {
    return this.taxonomyService
      .group(TaxonomyGroup.assetType)
      .pipe(
        map((taxonomies: ITaxonomyAssetType[]) => taxonomies.find(t => t.properties.sourcesLayerId === sourceLayerId))
      );
  }

  public hasProperties(typeAsset: string): boolean {
    let result;
    this.getTaxonomyAsset(typeAsset as AssetType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((assetType: ITaxonomyAssetType) => {
        if (!assetType) {
          return;
        }
        const properties = assetType.properties?.dataKeys?.filter(e => e.isMainAttribute);
        properties?.length ? (result = true) : (result = false);
      });
    return result;
  }

  public extractPropertiesList(asset: IAsset, assetDataKeys: ITaxonomyAssetDataKey[]): IPropertie[] {
    this.getTaxonomyAsset(asset.typeId as AssetType)
      .pipe(takeUntil(this.destroy$))
      .subscribe((assetType: ITaxonomyAssetType) => {
        if (!assetType) {
          return;
        }
        this.properties = [];
        if (assetType.properties.dataKeys) {
          assetType.properties.dataKeys
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .forEach(dataKey => {
              if (!dataKey.isMainAttribute) {
                return;
              }

              let value = null;

              if (asset.properties && asset.properties[dataKey.code]) {
                value = asset.properties[dataKey.code];

                const assetDataKey = assetDataKeys.find(item => item.code === dataKey.code);
                if (assetDataKey?.properties?.unit) {
                  value += assetDataKey?.properties?.unit;
                }
              }

              this.properties.push({
                code: dataKey.code,
                value: Utils.formatToDate(value, 'yyyy-MM-dd')
              });
            });
        }
      });
    return this.properties;
  }
}

import { Injectable } from '@angular/core';
import { ITaxonomy } from '@villemontreal/agir-work-planning-lib/dist/src';
import { cloneDeep } from 'lodash';
import { combineLatest, Observable } from 'rxjs';
import { map, shareReplay, takeUntil } from 'rxjs/operators';
import { IGlobalLayer } from 'src/app/map/panel/asset-layer/global-layer';

import { IGlobalLabel } from '../../models/filters/global-filter-label';
import { GlobalLayerService } from '../global-layer.service';
import { TaxonomiesService } from '../taxonomies.service';

const TAXONOMY_MAP_ASSET_LOGIC_LAYER = 'mapAssetLogicLayer';
@Injectable({
  providedIn: 'root'
})
export class GlobalLayerLabelService {
  constructor(
    private readonly globalLayerService: GlobalLayerService,
    private readonly taxonomiesService: TaxonomiesService
  ) {}

  public createLayerLabelsObservable(
    destroy$: Observable<unknown>,
    layer$?: Observable<IGlobalLayer>
  ): Observable<IGlobalLabel[]> {
    return combineLatest(
      layer$ ? layer$ : this.globalLayerService.layer$.pipe(takeUntil(destroy$)),
      this.taxonomiesService.taxonomies.pipe(takeUntil(destroy$))
    ).pipe(
      takeUntil(destroy$),
      map(([selectedLayer, taxonomies]) => this.buildCurrentSelection(selectedLayer, taxonomies)),
      shareReplay()
    );
  }

  public pickLayer(layer: IGlobalLayer, keys: string[]): IGlobalLayer {
    if (!keys?.length) {
      return {};
    }

    const layerCopy = cloneDeep(layer);
    const layerKeys = keys.map(x => x.split('.')[0]);
    for (const key in layer) {
      if (!layerCopy.hasOwnProperty(key)) {
        continue;
      }
      if (!layerKeys.includes(key)) {
        delete layerCopy[key];
        continue;
      }
      const element = layerCopy[key];
      if (Array.isArray(element)) {
        for (const item of cloneDeep(element)) {
          if (!keys.includes(`${key}.${item}`)) {
            element.splice(element.indexOf(item), 1);
          }
        }
      }
    }
    return layerCopy;
  }

  private buildCurrentSelection(layer: IGlobalLayer, taxonomies: ITaxonomy[]): IGlobalLabel[] {
    const layerLabels: IGlobalLabel[] = [];
    for (const key in layer) {
      if (!layer.hasOwnProperty(key) || !this.globalLayerService.isLayerActive(layer, key as keyof IGlobalLayer)) {
        continue;
      }

      const subLayers: string[] = layer[key];

      for (const item of subLayers) {
        layerLabels.push({
          key: `${key}.${item}`,
          label: taxonomies.find(t => t.group === TAXONOMY_MAP_ASSET_LOGIC_LAYER && t.code === item)?.label
        });
      }
    }
    return layerLabels;
  }
}

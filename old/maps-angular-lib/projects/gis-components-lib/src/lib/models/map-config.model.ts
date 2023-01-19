import { TransformRequestFunction } from 'mapbox-gl';
import { ILayerConfig } from './layer-config.model';
import { ILayerGroup } from './layer-manager/layer-group';
import { ISources } from './sources';

export interface IMapConfig {
  mapOptions: mapboxgl.MapboxOptions;
  mapStyleDefinition: (string | ILayerConfig)[];
  customMapSources: ISources;
  customMapLayers: ILayerGroup;
  baseUrl: string;
  spriteName?: string;
  /**
   * @see https://docs.mapbox.com/mapbox-gl-js/api/ look for transformRequest
   */
  authRequestCallback?: TransformRequestFunction;
}

export interface IFeatureStateParam {
  source: string;
  sourceLayer: string;
  id: string | number | undefined;
  layerId: string;
}

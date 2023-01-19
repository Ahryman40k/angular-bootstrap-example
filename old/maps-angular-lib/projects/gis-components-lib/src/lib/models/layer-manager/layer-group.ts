import { Layer } from 'mapbox-gl';

// TODO: outside of style builder ?
export interface ILayerGroup {
  [layerGroupName: string]: Layer[];
}

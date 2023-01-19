import { ILayerGroup } from './layer-manager/layer-group';
import { ISources } from './sources';

// TODO: outside of style builder ?
export interface IMapStyleConfig {
  customMapSources: ISources;
  customMapLayers: ILayerGroup;
}

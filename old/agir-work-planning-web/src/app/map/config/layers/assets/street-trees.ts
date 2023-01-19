import { Layer } from 'mapbox-gl';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteSymbolLayers } from '../utils';

export const streetTree: Layer[] = [
  ...createCompleteSymbolLayers(MapLayers.STREET_TREE, MapLayersSources.HORTICULTURE, mapStyleConfig.asset.streetTree)
];

import { Layer } from 'mapbox-gl';

import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers, createCompleteSymbolLayers } from '../utils';

export const hqLine: Layer[] = [
  ...createCompleteLineLayers(MapLayers.HYDRO_QUEBEC_LINES, MapLayersSources.HYDRO_QUEBEC, mapStyleConfig.asset.hqLine)
];

export const hqSubstation: Layer[] = [
  ...createCompleteSymbolLayers(
    MapLayers.HYDRO_QUEBEC_SUBSTATIONS,
    MapLayersSources.HYDRO_QUEBEC,
    mapStyleConfig.asset.hqSubstation
  )
];

export const pylon: Layer[] = [
  ...createCompleteSymbolLayers(MapLayers.PYLONES, MapLayersSources.HYDRO_QUEBEC, mapStyleConfig.asset.pylon)
];

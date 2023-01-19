import { Layer } from 'mapbox-gl';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteSymbolLayers } from '../utils';

export const waterPoint: Layer[] = [
  ...createCompleteSymbolLayers(
    MapLayers.WATER_POINT,
    MapLayersSources.SECURITE_CIVILE,
    mapStyleConfig.asset.waterPoint
  )
];

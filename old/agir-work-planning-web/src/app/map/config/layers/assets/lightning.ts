import { Layer } from 'mapbox-gl';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers, createCompletePolygonLayers, createCompleteSymbolLayers } from '../utils';

export const trafficLight: Layer[] = [
  ...createCompleteSymbolLayers(MapLayers.TRAFFIC_LIGHT, MapLayersSources.ECLAIRAGE, mapStyleConfig.asset.trafficLight)
];

export const barrel: Layer[] = [
  ...createCompletePolygonLayers(MapLayers.BARRELS, MapLayersSources.ECLAIRAGE, mapStyleConfig.asset.barrel, true)
];

export const cable: Layer[] = [
  ...createCompleteLineLayers(MapLayers.CABLES, MapLayersSources.ECLAIRAGE, mapStyleConfig.asset.cable)
];

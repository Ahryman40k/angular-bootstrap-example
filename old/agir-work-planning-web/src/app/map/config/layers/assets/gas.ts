import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

export const gas: Layer[] = [
  {
    id: `${MapLayers.GAZ_BORDER}`,
    type: LayerType.LINE,
    source: MapLayersSources.GAZ,
    'source-layer': MapLayers.GAZ,
    paint: {
      'line-color': mapStyleConfig.asset.gas.colorBorder,
      'line-width': mapStyleConfig.asset.gas.lineBorder
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.GAZ}-border`,
    type: LayerType.LINE,
    source: MapLayersSources.GAZ,
    'source-layer': MapLayers.GAZ,
    filter: filterById(FilterId.id),
    paint: {
      'line-color': mapStyleConfig.asset.gas.colorBorder,
      'line-width': mapStyleConfig.asset.gas.lineBorder
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: MapLayers.GAZ,
    type: LayerType.LINE,
    source: MapLayersSources.GAZ,
    'source-layer': MapLayers.GAZ,
    paint: {
      'line-color': mapStyleConfig.asset.gas.color,
      'line-width': mapStyleConfig.asset.gas.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.GAZ}`,
    type: LayerType.LINE,
    source: MapLayersSources.GAZ,
    'source-layer': MapLayers.GAZ,
    filter: filterById(FilterId.id),
    paint: {
      'line-color': mapStyleConfig.asset.gas.color,
      'line-width': mapStyleConfig.asset.gas.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.GAZ}`,
    type: LayerType.LINE,
    source: MapLayersSources.GAZ,
    'source-layer': MapLayers.GAZ,
    filter: filterById(FilterId.id),
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.gas.lineBorder
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.GAZ}`,
    type: LayerType.LINE,
    source: MapLayersSources.GAZ,
    'source-layer': MapLayers.GAZ,
    filter: filterById(FilterId.id),
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.gas.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  }
];

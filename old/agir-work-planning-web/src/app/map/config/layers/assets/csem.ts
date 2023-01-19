import { Layer } from 'mapbox-gl';

import { LayerGeometryType, LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterByGeometryTypeAndById } from '../utils';

export const csemMassives: Layer[] = [
  {
    id: MapLayers.CSEM_MASSIF,
    type: LayerType.LINE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_MASSIF,
    paint: {
      'line-color': mapStyleConfig.asset.csem.color,
      'line-opacity': mapStyleConfig.asset.csem.opacity,
      'line-width': mapStyleConfig.asset.csem.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.CSEM_MASSIF}`,
    type: LayerType.LINE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_MASSIF,
    filter: filterByGeometryTypeAndById(LayerGeometryType.LINE_STRING),
    paint: {
      'line-color': mapStyleConfig.asset.csem.color,
      'line-opacity': mapStyleConfig.asset.csem.opacity,
      'line-width': mapStyleConfig.asset.csem.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.CSEM_MASSIF}`,
    type: LayerType.LINE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_MASSIF,
    filter: filterByGeometryTypeAndById(LayerGeometryType.LINE_STRING),
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.csem.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.CSEM_MASSIF}`,
    type: LayerType.LINE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_MASSIF,
    filter: filterByGeometryTypeAndById(LayerGeometryType.LINE_STRING),
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.csem.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  }
];

export const csemStructures: Layer[] = [
  {
    id: `${MapLayers.CSEM_STRUCTURE}`,
    type: LayerType.CIRCLE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_STRUCTURE,
    paint: {
      'circle-color': mapStyleConfig.asset.csem.color,
      'circle-stroke-color': mapStyleConfig.asset.csem.strokeColor,
      'circle-stroke-width': mapStyleConfig.asset.csem.strokeWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.CSEM_STRUCTURE}`,
    type: LayerType.CIRCLE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_STRUCTURE,
    filter: filterByGeometryTypeAndById(LayerGeometryType.POINT),
    paint: {
      'circle-color': mapStyleConfig.asset.csem.color,
      'circle-stroke-color': mapStyleConfig.asset.csem.strokeColor,
      'circle-stroke-width': mapStyleConfig.asset.csem.strokeWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.CSEM_STRUCTURE}`,
    type: LayerType.CIRCLE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_STRUCTURE,
    filter: filterByGeometryTypeAndById(LayerGeometryType.POINT),
    paint: {
      'circle-color': mapStyleConfig.colors.highlight,
      'circle-stroke-color': mapStyleConfig.colors.highlight,
      'circle-stroke-width': mapStyleConfig.asset.csem.strokeWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.CSEM_STRUCTURE}`,
    type: LayerType.CIRCLE,
    source: MapLayersSources.CSEM,
    'source-layer': MapLayers.CSEM_STRUCTURE,
    filter: filterByGeometryTypeAndById(LayerGeometryType.POINT),
    paint: {
      'circle-color': mapStyleConfig.colors.hover,
      'circle-stroke-color': mapStyleConfig.asset.csem.strokeColor,
      'circle-stroke-width': mapStyleConfig.asset.csem.strokeWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  }
];

import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPostfix, LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';
const { highlight, hover } = mapStyleConfig.colors;

export const unifiedSections: Layer[] = [
  {
    id: MapLayers.UNIFIED_SECTIONS,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_SECTIONS,
    minzoom: mapStyleConfig.topology.zoom,
    paint: {
      'line-color': mapStyleConfig.topology.unifiedSections.color,
      'line-width': mapStyleConfig.topology.unifiedSections.lineWidth
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.UNIFIED_SECTIONS}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_SECTIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.topology.zoom,
    paint: {
      'line-color': mapStyleConfig.topology.unifiedSections.color,
      'line-width': mapStyleConfig.topology.unifiedSections.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.UNIFIED_SECTIONS}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_SECTIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.topology.zoom,
    paint: {
      'line-color': highlight,
      'line-width': mapStyleConfig.topology.unifiedSections.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.UNIFIED_SECTIONS}-${LayerPostfix.HOVER_BORDER}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_SECTIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.topology.zoom,
    paint: {
      'line-color': hover,
      'line-width': mapStyleConfig.topology.unifiedSections.lineWidth + 4
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.UNIFIED_SECTIONS}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_SECTIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.topology.zoom,
    paint: {
      'line-color': mapStyleConfig.topology.unifiedSections.color,
      'line-width': mapStyleConfig.topology.unifiedSections.lineWidth
    }
  }
];

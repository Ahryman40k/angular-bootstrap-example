import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

const BUS_STOP_ICON = 'arret_bus';

export const busStop: Layer[] = [
  {
    id: MapLayers.BUS_STOP,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_STOP,
    minzoom: mapStyleConfig.transport.zoom,
    layout: {
      'icon-image': `${BUS_STOP_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.BUS_STOP}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_STOP,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.zoom,
    layout: {
      'icon-image': `${BUS_STOP_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.BUS_STOP}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_STOP,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.zoom,
    layout: {
      'icon-image': `${BUS_STOP_ICON}_s`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.BUS_STOP}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_STOP,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.zoom,
    layout: {
      'icon-image': `${BUS_STOP_ICON}_h`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  }
];

export const busLine: Layer[] = [
  {
    id: MapLayers.BUS_LINE,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_LINE,
    minzoom: mapStyleConfig.transport.zoom,
    paint: {
      'line-color': mapStyleConfig.transport.busLine.color,
      'line-width': 3
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.BUS_LINE}`,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_LINE,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.zoom,
    paint: {
      'line-color': mapStyleConfig.transport.busLine.color,
      'line-width': mapStyleConfig.transport.busLine.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.BUS_LINE}`,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_LINE,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.transport.busLine.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.BUS_LINE}`,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.BUS_LINE,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.transport.busLine.lineWidth
    }
  }
];

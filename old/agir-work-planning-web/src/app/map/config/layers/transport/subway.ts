import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { buildMatchExpressionFromAttribute, filterById, IKeyValueString } from '../utils';

const SUBWAY_STATION_ICON = 'station metro';

export const metroStation: Layer[] = [
  {
    id: MapLayers.SUBWAY_STATIONS,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_STATIONS,
    minzoom: mapStyleConfig.transport.metroStation.zoom,
    layout: {
      'icon-image': `${SUBWAY_STATION_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SUBWAY_STATIONS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_STATIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.metroStation.zoom,
    layout: {
      'icon-image': `${SUBWAY_STATION_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SUBWAY_STATIONS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_STATIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.metroStation.zoom,
    layout: {
      'icon-image': `${SUBWAY_STATION_ICON} s`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SUBWAY_STATIONS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_STATIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.metroStation.zoom,
    layout: {
      'icon-image': `${SUBWAY_STATION_ICON} h`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  }
];

const subwayLinesAttributeName = mapStyleConfig.transport.undergroundLine.propertyKey;
const subwayLinesKeysValues: IKeyValueString = mapStyleConfig.transport.undergroundLine.keyValue;

export const undergroundLine: Layer[] = [
  {
    id: MapLayers.SUBWAY_LINES,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_LINES,
    minzoom: mapStyleConfig.transport.undergroundLine.zoom,
    paint: {
      'line-color': buildMatchExpressionFromAttribute(subwayLinesAttributeName, subwayLinesKeysValues),
      'line-width': mapStyleConfig.transport.undergroundLine.lineWidth
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SUBWAY_LINES}`,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_LINES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.undergroundLine.zoom,
    paint: {
      'line-color': mapStyleConfig.transport.undergroundLine.color,
      'line-width': mapStyleConfig.transport.undergroundLine.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SUBWAY_LINES}`,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_LINES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.undergroundLine.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.transport.undergroundLine.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SUBWAY_LINES}`,
    type: LayerType.LINE,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.SUBWAY_LINES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.undergroundLine.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.transport.undergroundLine.lineWidth
    }
  }
];

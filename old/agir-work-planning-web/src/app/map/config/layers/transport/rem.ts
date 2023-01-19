import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

const REM_STATION_ICON = 'station_rem';

export const remStation: Layer[] = [
  {
    id: MapLayers.REM_STATIONS,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.REM_STATIONS,
    minzoom: mapStyleConfig.transport.remStation.zoom,
    layout: {
      'icon-image': `${REM_STATION_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.REM_STATIONS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.REM_STATIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.remStation.zoom,
    layout: {
      'icon-image': `${REM_STATION_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.REM_STATIONS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.REM_STATIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.remStation.zoom,
    layout: {
      'icon-image': `${REM_STATION_ICON}_s`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.REM_STATIONS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.TRANSPORT_COMMUN,
    'source-layer': MapLayers.REM_STATIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.transport.remStation.zoom,
    layout: {
      'icon-image': `${REM_STATION_ICON}_h`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  }
];

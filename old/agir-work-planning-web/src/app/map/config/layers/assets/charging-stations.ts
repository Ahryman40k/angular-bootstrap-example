import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

const CHARGING_STATIONS_ICON = 'borne_recharge';

export const electricalTerminal: Layer[] = [
  {
    id: MapLayers.ELECTRICAL_TERMINALS,
    type: LayerType.SYMBOL,
    source: MapLayersSources.BORNES_RECHARGES,
    'source-layer': MapLayers.ELECTRICAL_TERMINALS,
    minzoom: mapStyleConfig.asset.electricalTerminal.zoom,
    layout: {
      'icon-image': `${CHARGING_STATIONS_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.ELECTRICAL_TERMINALS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.BORNES_RECHARGES,
    'source-layer': MapLayers.ELECTRICAL_TERMINALS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.electricalTerminal.zoom,
    layout: {
      'icon-image': `${CHARGING_STATIONS_ICON}`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.ELECTRICAL_TERMINALS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.BORNES_RECHARGES,
    'source-layer': MapLayers.ELECTRICAL_TERMINALS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.electricalTerminal.zoom,
    layout: {
      'icon-image': `${CHARGING_STATIONS_ICON}_s`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.ELECTRICAL_TERMINALS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.BORNES_RECHARGES,
    'source-layer': MapLayers.ELECTRICAL_TERMINALS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.electricalTerminal.zoom,
    layout: {
      'icon-image': `${CHARGING_STATIONS_ICON}_h`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  }
];

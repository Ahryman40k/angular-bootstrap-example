import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

const FIRE_HYDRANT_ICONS = 'borne_incendie_mtl';

export const fireHydrants: Layer[] = [
  {
    id: MapLayers.FIRE_HYDRANTS,
    type: LayerType.SYMBOL,
    source: MapLayersSources.ACTIFS_EAU,
    'source-layer': MapLayers.FIRE_HYDRANTS,
    minzoom: mapStyleConfig.asset.zoom,
    layout: {
      'icon-image': FIRE_HYDRANT_ICONS,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.FIRE_HYDRANTS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.ACTIFS_EAU,
    'source-layer': MapLayers.FIRE_HYDRANTS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    layout: {
      'icon-image': FIRE_HYDRANT_ICONS,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.FIRE_HYDRANTS}`,
    type: LayerType.SYMBOL,
    source: MapLayersSources.ACTIFS_EAU,
    'source-layer': MapLayers.FIRE_HYDRANTS,
    filter: filterById(FilterId.id),
    layout: {
      'icon-image': `${FIRE_HYDRANT_ICONS}_s`,
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    },
    minzoom: mapStyleConfig.asset.zoom
  }
];

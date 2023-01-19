import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

export const alleys: Layer[] = [
  {
    id: MapLayers.ALLEYS,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.ALLEYS,
    paint: {
      'line-color': mapStyleConfig.asset.alleys.color,
      'line-width': mapStyleConfig.asset.alleys.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.ALLEYS}`,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.ALLEYS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.asset.alleys.color,
      'line-width': mapStyleConfig.asset.alleys.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.ALLEYS}`,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.ALLEYS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.alleys.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.ALLEYS}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.ALLEYS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.alleys.lineWidth
    }
  }
];

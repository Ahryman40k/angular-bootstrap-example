import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

export const highways: Layer[] = [
  {
    id: MapLayers.HIGHWAYS,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.HIGHWAYS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.topology.highway.color,
      'line-width': mapStyleConfig.topology.highway.lineWidth
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.HIGHWAYS}`,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.HIGHWAYS,
    minzoom: mapStyleConfig.asset.zoom,
    filter: filterById(FilterId.id),
    paint: {
      'line-color': mapStyleConfig.topology.highway.color,
      'line-width': mapStyleConfig.topology.highway.lineWidth
    }
  }
];

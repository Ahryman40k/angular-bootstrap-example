import { Layer } from 'mapbox-gl';

import { LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';

export const flowDirection: Layer[] = [
  {
    id: MapLayers.FLOW_DIRECTION,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.FLOW_DIRECTION,
    type: LayerType.FILL,
    minzoom: mapStyleConfig.topology.flowDirection.zoom,
    paint: {
      'fill-color': mapStyleConfig.topology.flowDirection.color,
      'fill-opacity': mapStyleConfig.topology.flowDirection.opacity
    }
  }
];

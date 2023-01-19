import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

export const revisionRoadNetworks: Layer[] = [
  {
    id: MapLayers.REVISION_ROAD_NETWORK,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.REVISION_ROAD_NETWORK,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.topology.revisionRoadNetworks.color,
      'fill-outline-color': mapStyleConfig.topology.revisionRoadNetworks.color,
      'fill-opacity': mapStyleConfig.topology.revisionRoadNetworks.opacity
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.REVISION_ROAD_NETWORK}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.REVISION_ROAD_NETWORK,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.topology.revisionRoadNetworks.color,
      'fill-outline-color': mapStyleConfig.topology.revisionRoadNetworks.color,
      'fill-opacity': mapStyleConfig.topology.revisionRoadNetworks.opacity
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.REVISION_ROAD_NETWORK}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.REVISION_ROAD_NETWORK,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.colors.highlight,
      'fill-outline-color': mapStyleConfig.colors.highlight
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.REVISION_ROAD_NETWORK}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.REVISION_ROAD_NETWORK,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.colors.hover,
      'fill-outline-color': mapStyleConfig.colors.hover
    }
  }
];

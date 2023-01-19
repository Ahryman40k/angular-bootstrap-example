import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerGeometryType, LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers, filterByGeometryTypeAndById, filterById, generateCircleByColor } from '../utils';

const { color, strokeColor, strokeWidth } = mapStyleConfig.topology.roadNetworkNodes;
const { highlight, hover } = mapStyleConfig.colors;

export const roadNetworkArterial: Layer[] = [
  ...createCompleteLineLayers(
    MapLayers.ROAD_ARTERIAL_NETWORK,
    MapLayersSources.RESEAU_ROUTIER,
    mapStyleConfig.topology.roadNetworkArterial
  )
];

export const roadNetworkNodes: Layer[] = [
  {
    id: MapLayers.NODES,
    type: LayerType.CIRCLE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.NODES,
    minzoom: mapStyleConfig.asset.zoom,
    paint: generateCircleByColor({ color, strokeColor, strokeWidth })
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.NODES}`,
    type: LayerType.CIRCLE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.NODES,
    filter: filterByGeometryTypeAndById(LayerGeometryType.POINT),
    minzoom: mapStyleConfig.asset.zoom,
    paint: generateCircleByColor({ color, strokeColor, strokeWidth })
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.NODES}`,
    type: LayerType.CIRCLE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.NODES,
    filter: filterByGeometryTypeAndById(LayerGeometryType.POINT),
    minzoom: mapStyleConfig.asset.zoom,
    paint: generateCircleByColor({ color: highlight, strokeColor, strokeWidth })
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.NODES}`,
    type: LayerType.CIRCLE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.NODES,
    filter: filterByGeometryTypeAndById(LayerGeometryType.POINT),
    minzoom: mapStyleConfig.asset.zoom,
    paint: generateCircleByColor({ color: hover, strokeColor, strokeWidth })
  }
];

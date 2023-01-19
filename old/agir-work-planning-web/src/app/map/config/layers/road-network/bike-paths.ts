import { Layer } from 'mapbox-gl';

import { LayerGeometryType, LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterByGeometryTypeAndById } from '../utils';

export const bikePaths: Layer[] = [
  {
    id: `${MapLayers.BIKES_PATHS}`,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.BIKES_PATHS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.asset.bikePaths.color,
      'line-width': mapStyleConfig.asset.bikePaths.lineWidth
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.BIKES_PATHS}`,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.BIKES_PATHS,
    filter: filterByGeometryTypeAndById(LayerGeometryType.LINE_STRING),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.asset.bikePaths.color,
      'line-width': mapStyleConfig.asset.bikePaths.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.BIKES_PATHS}`,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.BIKES_PATHS,
    filter: filterByGeometryTypeAndById(LayerGeometryType.LINE_STRING),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.bikePaths.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.BIKES_PATHS}`,
    type: LayerType.LINE,
    source: MapLayersSources.RESEAU_ROUTIER,
    'source-layer': MapLayers.BIKES_PATHS,
    filter: filterByGeometryTypeAndById(LayerGeometryType.LINE_STRING),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.bikePaths.lineWidth
    }
  }
];

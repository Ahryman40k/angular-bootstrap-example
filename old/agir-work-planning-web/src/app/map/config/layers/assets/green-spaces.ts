import { Layer } from 'mapbox-gl';

import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompletePolygonLayers } from '../utils';

export const greenSpace: Layer[] = [
  ...createCompletePolygonLayers(MapLayers.GREEN_SPACE, MapLayersSources.ESPACES_VERTS, mapStyleConfig.asset.greenSpace)
];

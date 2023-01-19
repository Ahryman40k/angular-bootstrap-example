import { Layer } from 'mapbox-gl';

import { LayerType } from '../layer-enums';
import { MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';

export const selectionRadius: Layer[] = [
  {
    id: MapLayersSources.DYNAMIC_SELECTION_RADIUS,
    type: LayerType.FILL,
    source: MapLayersSources.DYNAMIC_SELECTION_RADIUS,
    paint: {
      'fill-color': mapStyleConfig.colors.black,
      'fill-opacity': mapStyleConfig.selectionRadius.area.opacity
    }
  },
  {
    id: `${MapLayersSources.DYNAMIC_SELECTION_RADIUS}-halo`,
    type: LayerType.LINE,
    source: MapLayersSources.DYNAMIC_SELECTION_RADIUS,
    paint: {
      'line-color': mapStyleConfig.colors.darkerGray,
      'line-width': 1,
      'line-opacity': 1
    }
  }
];

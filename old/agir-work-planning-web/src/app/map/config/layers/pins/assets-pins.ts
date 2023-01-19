import { Layer } from 'mapbox-gl';

import { LayerType } from '../layer-enums';
import { MapLayersSources } from '../map-enums';

export const assetsPins: Layer[] = [
  {
    id: MapLayersSources.ASSETS_PINS,
    source: MapLayersSources.ASSETS_PINS,
    type: LayerType.SYMBOL,
    layout: {
      'icon-image': 'asset-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    }
  }
];

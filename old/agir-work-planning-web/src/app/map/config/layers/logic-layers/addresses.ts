import { Layer } from 'mapbox-gl';

import { LayerType } from '../layer-enums';
import { MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';

export const addresses: Layer[] = [
  {
    id: MapLayersSources.ADDRESSES_PINS,
    source: MapLayersSources.ADDRESSES_PINS,
    type: LayerType.SYMBOL,
    layout: {
      'icon-image': 'address-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  }
];

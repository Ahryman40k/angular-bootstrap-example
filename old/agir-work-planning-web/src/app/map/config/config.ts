import { IMapConfig } from '@villemontreal/maps-angular-lib';

import { customMapLayers } from './custom-map-layers';
import { customMapSources } from './sources';

/**
 * Put configuration in its own file to simplify environment configuration.
 */
export const mapConfig = {
  mapOptions: {
    container: 'not_used',
    zoom: 10.2,
    minZoom: 10,
    maxZoom: 20,
    maxBounds: [
      [-74.7, 45],
      [-72.7, 46]
    ],
    center: [-73.7, 45.55]
  },
  mapStyleDefinition: [],
  spriteName: 'agir',
  customMapSources,
  customMapLayers
} as IMapConfig;

import { Layer } from 'mapbox-gl';

import { MapLayersSources } from '../../map-enums';
import { createCountByLayer } from '../boroughs/utils';

export const countByCity: Layer[] = [
  createCountByLayer('count-by-city-point', 'city-count-cluster', MapLayersSources.COUNT_BY_CITY, [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    0,
    1
  ]),
  createCountByLayer('count-by-city-point-hover', 'borough-count-cluster-hover', MapLayersSources.COUNT_BY_CITY, [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    1,
    0
  ])
];

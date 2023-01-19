import { Layer } from 'mapbox-gl';

import { MapLayersSources } from '../../map-enums';
import { createCountByLayer } from './utils';

export const countByBorough: Layer[] = [
  createCountByLayer('count-by-borough-point', 'borough-count-cluster', MapLayersSources.COUNT_BY_BOROUGH, [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    0,
    1
  ]),
  createCountByLayer('count-by-borough-point-hover', 'borough-count-cluster-hover', MapLayersSources.COUNT_BY_BOROUGH, [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    1,
    0
  ])
];

import { Layer } from 'mapbox-gl';
import { generateIdFilter } from '../../shared/utils/utils';

export let roadSections: Layer[] = [
  {
    id: 'query-roads',
    type: 'line',
    source: 'roads',
    'source-layer': 'road-sections',
    minzoom: 11,
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': 'rgba(255, 255, 255, 0)',
      'line-width': {
        base: 1.55,
        stops: [[12, 1.35], [14, 5], [18, 35]]
      }
    }
  },
  {
    id: 'highlight-roads',
    type: 'line',
    source: 'basemap',
    'source-layer': 'road-sections',
    minzoom: 11,
    filter: ['all', generateIdFilter()],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#00FF00',
      'line-width': {
        base: 1.55,
        stops: [[12, 1.35], [14, 5], [18, 35]]
      }
    }
  },
  {
    id: 'hover-roads',
    type: 'line',
    source: 'basemap',
    'source-layer': 'road-sections',
    minzoom: 11,
    filter: ['all', generateIdFilter()],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#0000FF',
      'line-width': {
        base: 1.55,
        stops: [[12, 1.35], [14, 5], [18, 35]]
      }
    }
  }
];

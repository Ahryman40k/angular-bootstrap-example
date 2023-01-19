import { Layer } from 'mapbox-gl';

export let permitsDefault: Layer[] = [
  {
    id: 'permits',
    type: 'line',
    source: 'occupancy-permits',
    'source-layer': 'permits',
    minzoom: 12,
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'unSelected'], true], '#0000FF', '#0000FF'],
      'line-width': {
        base: 1.4,
        stops: [[10, 1.45], [14, 6], [18, 38]]
      }
    }
  },

  {
    id: 'permits-centroids',
    type: 'circle',
    source: 'occupancy-permits',
    'source-layer': 'permits-centroids',
    minzoom: 12,
    paint: {
      'circle-radius': {
        base: 1.75,
        stops: [[12, 4], [22, 180]]
      }
    }
  }
];

export let permitsJaune: Layer[] = [
  {
    id: 'permits-jaune',
    type: 'line',
    source: 'occupancy-permits',
    'source-layer': 'permits',
    minzoom: 12,
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'unSelected'], true], '#FFFF00', '#FFFF00'],
      'line-width': {
        base: 1.4,
        stops: [[10, 1.45], [14, 6], [18, 38]]
      }
    }
  },

  {
    id: 'permits-centroids-jaune',
    type: 'circle',
    source: 'occupancy-permits',
    'source-layer': 'permits-centroids',
    minzoom: 12,
    paint: {
      'circle-radius': {
        base: 1.75,
        stops: [[12, 4], [22, 180]]
      }
    }
  }
];

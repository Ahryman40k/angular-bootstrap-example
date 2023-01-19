import { Layer } from 'mapbox-gl';

export let egouts: Layer[] = [
  {
    id: 'egouts-line',
    type: 'line',
    source: 'egouts',
    'source-layer': 'egouts',
    filter: ['all', ['==', '$type', 'Polygon']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#D9414D',
      'line-width': {
        base: 1.55,
        stops: [[12, 1.35], [14, 5], [18, 35]]
      }
    }
  },
  {
    id: 'egouts-poly',
    type: 'fill',
    source: 'egouts',
    'source-layer': 'egouts',

    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': '#D9414D',
      'fill-opacity': 0.25
    }
  },
  {
    id: 'egouts-points',
    type: 'circle',
    source: 'egouts',
    'source-layer': 'egouts',
    filter: ['all', ['==', '$type', 'Point']],
    paint: {
      'circle-color': '#FFFFFF',
      'circle-radius': 10
    }
  },
  {
    id: 'egouts-text',
    type: 'symbol',
    source: 'egouts',
    'source-layer': 'egouts',
    filter: ['all', ['==', '$type', 'Point']],
    layout: {
      'text-font': ['OpenSans-SemiBold'],
      'text-field': '{text}',
      'text-size': 12,
      'symbol-placement': 'point',
      // Utiliser désactivé le 'fade-in' du texte... // https://github.com/mapbox/mapbox-gl-js/issues/6752
      'text-allow-overlap': true
    },
    paint: {
      'text-color': '#000000',
      'text-halo-color': 'rgba(255,255,255,0.75)',
      'text-halo-width': 2
    }
  }
];

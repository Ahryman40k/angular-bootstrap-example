import { Layer } from 'mapbox-gl';
// Voir : https://bitbucket.org/villemontreal/maps-angular-lib/branch/feature/borough-polygon#diff

const layersColors = {
  ARRETS_INTERDITS: {
    DEFAULT: '#ff0000', // RED
    HIGHLIGHT: '#ff6666', // Clear RED
    HOVER: '#0000ff' // Clear Blue
  },
  BORNES_PAIEMENT: {
    DEFAULT: '#003380', // BLUE
    HIGHLIGHT: '#1a75ff', //
    HOVER: '#0000ff' // Clear Blue
  },
  PARCOMETRES: {
    DEFAULT: '#b3b300', // dark yellow
    HIGHLIGHT: '#ffff4d', // yellow
    HOVER: '#0000ff' // Clear Blue
  },
  POTEAUX: {
    DEFAULT: '#008000', // dark green
    HIGHLIGHT: '#4dff4d', // green
    HOVER: '#0000ff' // Clear Blue
  }
};

export const boroughs: Layer[] = [
  {
    id: 'boroughs-pt',
    type: 'circle',
    source: 'cities-boroughs',
    'source-layer': 'boroughs',
    filter: ['all', ['==', '$type', 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 5000,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.PARCOMETRES.DEFAULT
    }
  },
  {
    id: 'boroughs-poly',
    type: 'fill',
    source: 'cities-boroughs',
    'source-layer': 'boroughs',
    // filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': layersColors.BORNES_PAIEMENT.DEFAULT,
      'fill-opacity': 0.5
    }
  },

  {
    id: 'boroughs-line',
    type: 'line',
    source: 'cities-boroughs',
    'source-layer': 'boroughs',
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': layersColors.BORNES_PAIEMENT.DEFAULT,
      'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, 2, 21, 55]
    }
  }
];

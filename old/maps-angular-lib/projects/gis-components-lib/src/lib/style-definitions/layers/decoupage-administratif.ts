import { Layer } from 'mapbox-gl';

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

export const villeArrondissementsOfficiels: Layer[] = [
  {
    id: 'villes-arrondissement-pt',
    type: 'circle',
    source: 'decoupages-administratifs',
    'source-layer': 'villes-et-arrondissements-officiel',
    filter: ['all', ['==', '$type', 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 500,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.PARCOMETRES.DEFAULT
    }
  },

  // {
  //   id: 'villes-arrondissement-poly',
  //   type: 'fill',
  //   source: 'decoupages-administratifs',
  //   'source-layer': 'villes-et-arrondissements-officiel',
  //   // filter: ['all', ['==', '$type', 'Polygon']],
  //   paint: {
  //     'fill-color': layersColors.BORNES_PAIEMENT.DEFAULT,
  //     'fill-opacity': 1
  //   }
  // },

  {
    id: 'villes-arrondissement-line',
    type: 'line',
    source: 'decoupages-administratifs',
    'source-layer': 'villes-et-arrondissements-officiel',
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

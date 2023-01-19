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

export const parcometres: Layer[] = [
  {
    id: 'parcometres',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'parcometres',
    filter: ['all', ['==', '$type', 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.PARCOMETRES.DEFAULT
    }
  },
  {
    id: 'hover-parcometres',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'parcometres',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.PARCOMETRES.HOVER
    }
  },
  {
    id: 'highlight-parcometres',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'parcometres',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.PARCOMETRES.HIGHLIGHT
    }
  }
];

export const poteaux: Layer[] = [
  {
    id: 'poteaux',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'poteaux',
    filter: ['all', ['==', '$type', 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.POTEAUX.DEFAULT
    }
  },
  {
    id: 'highlight-poteaux',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'poteaux',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.POTEAUX.HIGHLIGHT
    }
  },
  {
    id: 'hover-poteaux',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'poteaux',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.POTEAUX.HOVER
    }
  }
];

export const bornesDePaiement: Layer[] = [
  {
    id: 'bornes-de-paiement',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'bornes-de-paiement',
    filter: ['all', ['==', '$type', 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.BORNES_PAIEMENT.DEFAULT
    }
  },
  {
    id: 'highlight-bornes-de-paiement',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'bornes-de-paiement',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.BORNES_PAIEMENT.HIGHLIGHT
    }
  },
  {
    id: 'hover-bornes-de-paiement',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'bornes-de-paiement',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 5], [15, 5], [16, 5], [17, 5], [18, 5]]
      },
      'circle-color': layersColors.BORNES_PAIEMENT.HOVER
    }
  }
];

export const arretInterdit: Layer[] = [
  {
    id: 'arrets-interdits',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'arrets-interdits',
    filter: ['all', ['==', '$type', 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 7], [15, 7], [16, 7], [17, 7], [18, 7]]
      },
      'circle-color': layersColors.ARRETS_INTERDITS.DEFAULT
    }
  },
  {
    id: 'highlight-arrets-interdits',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'arrets-interdits',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 7], [15, 7], [16, 7], [17, 7], [18, 7]]
      },
      'circle-color': layersColors.ARRETS_INTERDITS.HIGHLIGHT
    }
  },
  {
    id: 'hover-arrets-interdits',
    type: 'circle',
    source: 'signalisation-entraves',
    'source-layer': 'arrets-interdits',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false], ['==', ['geometry-type'], 'Point']],
    minzoom: 16,
    paint: {
      'circle-radius': {
        base: 100,
        stops: [[14, 7], [15, 7], [16, 7], [17, 7], [18, 7]]
      },
      'circle-color': layersColors.ARRETS_INTERDITS.HOVER
    }
  }
];

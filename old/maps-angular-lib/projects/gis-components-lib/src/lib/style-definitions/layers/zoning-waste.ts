import { Layer } from 'mapbox-gl';

export let zoningWaste: Layer[] = [
  {
    id: 'recycling',
    type: 'line',
    source: 'zoning',
    'source-layer': 'recycling',
    minzoom: 11,
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'unSelected'], true], '#AFC2C6', 'rgb(255,255,0)'],
      'line-offset': ['case', ['boolean', ['feature-state', 'unSelected'], true], 0, 2],
      'line-width': [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 2.5, 5],
        18,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 10, 20]
      ],
      'line-dasharray': [1, 3]
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  },

  {
    id: 'recycling-query',
    type: 'fill',
    source: 'zoning',
    'source-layer': 'recycling',
    minzoom: 11,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgba(255,255,0, 0.25)'
      ]
    },
    layout: {}
  },

  {
    id: 'green-waste',
    type: 'line',
    source: 'zoning',
    'source-layer': 'green-waste',
    minzoom: 11,
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'unSelected'], true], '#B6B592', 'rgb(255,255,0)'],
      'line-offset': ['case', ['boolean', ['feature-state', 'unSelected'], true], 0, 2],
      'line-width': [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 2.5, 5],
        18,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 10, 20]
      ],
      'line-dasharray': [1, 3]
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  },

  {
    id: 'green-waste-query',
    type: 'fill',
    source: 'zoning',
    'source-layer': 'green-waste',
    minzoom: 11,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgba(255,255,0, 0.25)'
      ]
    },
    layout: {}
  },

  {
    id: 'food-waste',
    type: 'line',
    source: 'zoning',
    'source-layer': 'food-waste',
    minzoom: 11,
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'unSelected'], true], '#92B9A4', 'rgb(255,255,0)'],
      'line-offset': ['case', ['boolean', ['feature-state', 'unSelected'], true], 0, 2],
      'line-width': [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 2.5, 5],
        18,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 10, 20]
      ],
      'line-dasharray': [1, 3]
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  },

  {
    id: 'food-waste-query',
    type: 'fill',
    source: 'zoning',
    'source-layer': 'food-waste',
    minzoom: 11,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgba(255,255,0, 0.25)'
      ]
    },
    layout: {}
  },

  {
    id: 'household-waste',
    type: 'line',
    source: 'zoning',
    'source-layer': 'household-waste',
    minzoom: 11,
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'unSelected'], true], '#B2A078', 'rgb(255,255,0)'],
      'line-offset': ['case', ['boolean', ['feature-state', 'unSelected'], true], 0, 2],
      'line-width': [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 2.5, 5],
        18,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 10, 20]
      ],
      'line-dasharray': [1, 3]
    }
  },

  {
    id: 'household-waste-query',
    type: 'fill',
    source: 'zoning',
    'source-layer': 'household-waste',
    minzoom: 11,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgba(255,255,0, 0.25)'
      ]
    },
    layout: {}
  },

  {
    id: 'organic-waste',
    type: 'line',
    source: 'zoning',
    'source-layer': 'organic-waste',
    minzoom: 13,
    paint: {
      'line-color': ['case', ['boolean', ['feature-state', 'unSelected'], true], '#F2CF5B', 'rgb(255,255,0)'],
      'line-offset': ['case', ['boolean', ['feature-state', 'unSelected'], true], 0, 2],
      'line-width': [
        'interpolate',
        ['exponential', 2],
        ['zoom'],
        10,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 2.5, 5],
        18,
        ['case', ['boolean', ['feature-state', 'unSelected'], true], 10, 20]
      ],
      'line-dasharray': [1, 3]
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  },

  {
    id: 'organic-waste-query',
    type: 'fill',
    source: 'zoning',
    'source-layer': 'organic-waste',
    minzoom: 13,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgba(255,255,0, 0.25)'
      ]
    },
    layout: {}
  }
];

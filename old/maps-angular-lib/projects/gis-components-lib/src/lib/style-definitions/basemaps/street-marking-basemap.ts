export let streetMarking: any = [
  {
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#e7e5e0'
    }
  },
  {
    id: 'water',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'water',
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'fill-color': '#75cff0'
    }
  },
  {
    id: 'parks',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'parks',
    paint: {
      'fill-color': '#B6E59E'
    }
  },
  {
    id: 'canals',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'canals',
    filter: ['==', '$type', 'Polygon'],
    paint: {
      'fill-color': '#75cff0'
    }
  },

  {
    id: 'highways',
    type: 'line',
    source: 'basemap-light',
    'source-layer': 'road-sections',
    filter: ['==', 'classification', 8],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': ['step', ['zoom'], '#F8F8F8', 10, '#F8F8F8', 16, '#6C6A75'],
      'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 10, 2, 21, 65]
    }
  },

  {
    id: 'arterial-network',
    type: 'line',
    source: 'basemap-light',
    'source-layer': 'road-sections',
    maxzoom: 16,
    filter: ['any', ['==', 'classification', 6], ['==', 'classification', 7]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#F8F8F8',
      'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, 2, 21, 55]
    }
  },

  {
    id: 'roads',
    type: 'line',
    source: 'basemap-light',
    'source-layer': 'road-sections',
    minzoom: 12,
    maxzoom: 16,
    filter: ['none', ['==', 'classification', 6], ['==', 'classification', 7], ['==', 'classification', 8]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#F8F8F8',
      'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 12, 1, 21, 40]
    }
  },

  {
    id: 'arterial-network-outside',
    type: 'line',
    source: 'basemap-light',
    'source-layer': 'road-sections',
    minzoom: 16,
    filter: ['all', ['==', 'inside', 0], ['any', ['==', 'classification', 6], ['==', 'classification', 7]]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#6C6A75',
      'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, 2, 21, 55]
    }
  },

  {
    id: 'roads-outside',
    type: 'line',
    source: 'basemap-light',
    'source-layer': 'road-sections',
    minzoom: 16,
    filter: [
      'all',
      ['==', 'inside', 0],
      ['none', ['==', 'classification', 6], ['==', 'classification', 7], ['==', 'classification', 8]]
    ],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#6C6A75',
      'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 12, 1, 21, 40]
    }
  },

  {
    id: 'buildings',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'buildings',
    minzoom: 15,
    paint: {
      'fill-color': ['interpolate', ['linear'], ['zoom'], 15, '#DCDCDC', 16, '#D3D3D3', 17, '#CECECE', 18, '#C3C3C3']
    }
  },

  {
    id: 'pavements',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'pavement-sections',
    minzoom: 16,
    paint: {
      'fill-color': '#6C6A75',
      'fill-outline-color': 'rgba(108, 106, 117, 1)'
    }
  },

  {
    id: 'intersections',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'intersections',
    minzoom: 16,
    paint: {
      'fill-color': '#6C6A75'
    }
  },

  {
    id: 'traffic-islands',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'traffic-islands',
    minzoom: 16,
    paint: {
      'fill-color': 'rgba(211, 206, 195, 1)'
    }
  },

  {
    id: 'sidewalks',
    type: 'fill',
    source: 'basemap-light',
    'source-layer': 'sidewalks',
    minzoom: 16,
    paint: {
      'fill-color': 'rgba(211, 206, 195, 1)'
    }
  },

  {
    id: 'rail-1',
    type: 'line',
    metadata: {},
    source: 'basemap-light',
    'source-layer': 'railroads',
    layout: { 'line-join': 'round' },
    paint: {
      'line-color': '#b5b5b5',
      'line-width': { base: 1.2, stops: [[14, 1], [18, 6]] }
    }
  },
  {
    id: 'rail-2',
    type: 'line',
    metadata: {},
    layout: { 'line-join': 'round' },
    paint: {
      'line-color': '#e9e9e9',
      'line-width': { base: 1.2, stops: [[14, 1], [18, 6]] },
      'line-dasharray': [2, 2]
    },
    source: 'basemap-light',
    'source-layer': 'railroads'
  },
  {
    id: 'roads-query',
    type: 'line',
    source: 'basemap-light',
    'source-layer': 'road-sections',
    minzoom: 16,
    filter: ['all', ['==', 'inside', 1], ['!=', 'classification', 8]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(0,0,0,0)',
        'rgba(255,255,0,0.3)'
      ],
      'line-width': ['interpolate', ['exponential', 2], ['zoom'], 16, 15, 17, 30, 18, 60, 19, 120, 20, 240, 21, 480]
    }
  },
  {
    id: 'blocs-écoliers',
    type: 'line',
    source: 'marking',
    'source-layer': 'marking-line',
    minzoom: 16,
    filter: ['==', ['get', 'style'], 1],
    paint: {
      'line-color': ['get', 'color'],
      'line-dasharray': [0.2, 0.2],
      'line-width': ['interpolate', ['exponential', 2], ['zoom'], 10, 5, 21, 60]
    },
    layout: {
      visibility: 'visible'
    }
  },

  {
    id: 'longitudinale',
    type: 'line',
    source: 'marking',
    'source-layer': 'marking-line',
    minzoom: 16,
    filter: ['==', ['get', 'style'], 2],
    layout: {
      visibility: 'visible'
    },
    paint: {
      'line-dasharray': [3, 5],
      'line-width': ['interpolate', ['exponential', 2], ['zoom'], 10, 1, 21, 3],
      'line-color': ['get', 'color']
    }
  },

  {
    id: 'bébé-ligne',
    type: 'line',
    source: 'marking',
    'source-layer': 'marking-line',
    minzoom: 16,
    filter: ['==', ['get', 'style'], 3],
    layout: {
      visibility: 'visible'
    },
    paint: {
      'line-dasharray': [1.5, 3],
      'line-width': ['interpolate', ['exponential', 2], ['zoom'], 10, 0.5, 21, 1.5],
      'line-color': ['get', 'color']
    }
  },

  {
    id: 'marking-line',
    type: 'line',
    source: 'marking',
    'source-layer': 'marking-line',
    minzoom: 16,
    filter: ['none', ['==', 'style', 1], ['==', 'style', 2], ['==', 'style', 3]],
    layout: {
      visibility: 'visible'
    },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': [
        'case',
        ['==', ['get', 'style'], 4],
        5,
        ['==', ['get', 'style'], 5],
        1.5,
        ['==', ['get', 'style'], 6],
        2,
        ['==', ['get', 'style'], 7],
        2,
        1
      ]
    }
  }
];

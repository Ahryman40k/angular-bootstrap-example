export let colorBasemap: any = [
  {
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#e7e5e0'
    }
  },

  {
    id: 'cities',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'cities',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#E6E4E0'
    }
  },

  {
    id: 'water',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'water',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#75cff0'
    }
  },

  {
    id: 'large_parks',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'parks',
    filter: ['>=', ['get', 'SHAPE_AREA'], 150000],
    paint: {
      'fill-color': '#B6E59E'
    }
  },

  {
    id: 'small_parks',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'parks',
    filter: ['<', ['get', 'SHAPE_AREA'], 150000],
    minzoom: 12,
    paint: {
      'fill-color': '#B6E59E'
    }
  },

  {
    id: 'lakes',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'lakes',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#75cff0'
    }
  },

  {
    id: 'streams',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'streams',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#272822'
    }
  },

  {
    id: 'canals',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'canals',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#75cff0'
    }
  },

  {
    id: 'roads_0',
    type: 'line',
    source: 'basemap',
    'source-layer': 'road-sections',
    minzoom: 14,
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#D6D9E6',
      'line-width': {
        base: 1.4,
        stops: [[10, 1.45], [14, 6], [18, 38]]
      }
    }
  },

  {
    id: 'arterial_network_0',
    type: 'line',
    source: 'basemap',
    'source-layer': 'road-sections',
    filter: ['any', ['==', ['get', 'classification'], 6], ['==', ['get', 'classification'], 7]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#DBDDE3',
      'line-width': {
        base: 1.2,
        stops: [[12, 1.45], [14, 5], [18, 38]]
      }
    }
  },

  {
    id: 'roads',
    type: 'line',
    source: 'basemap',
    'source-layer': 'road-sections',
    minzoom: 11,
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#F8F8F8',
      'line-width': {
        base: 1.55,
        stops: [[12, 1.35], [14, 5], [18, 35]]
      }
    }
  },

  {
    id: 'arterial network',
    type: 'line',
    source: 'basemap',
    'source-layer': 'road-sections',
    filter: ['any', ['==', ['get', 'classification'], 6], ['==', ['get', 'classification'], 7]],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#F8F8F8',
      'line-width': {
        base: 1.4,
        stops: [[10, 1.25], [14, 3], [18, 35]]
      }
    }
  },

  {
    id: 'highways',
    type: 'line',
    source: 'basemap',
    'source-layer': 'road-sections',
    filter: ['==', ['get', 'classification'], 8],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#FFA35C',
      'line-width': {
        base: 1.4,
        stops: [[6, 0.5], [20, 30]]
      }
    }
  },

  {
    id: 'buildings',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'buildings',
    minzoom: 13,
    paint: {
      'fill-color': ['interpolate', ['linear'], ['zoom'], 15, '#DCDCDC', 16, '#D3D3D3', 17, '#CECECE', 18, '#C3C3C3']
    }
  }
];

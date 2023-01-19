import { Layer } from 'mapbox-gl';

export let greyBasemap: Layer[] = [
  {
    id: 'background',
    type: 'background',
    paint: {
      'background-color': '#EFEFEF'
    }
  },

  {
    id: 'cities',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'cities',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#E8E8E8'
    }
  },

  {
    id: 'water',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'water',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#D0CFD4'
    }
  },

  {
    id: 'large_parks',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'parks',
    filter: ['>=', ['get', 'SHAPE_AREA'], 150000],
    paint: {
      'fill-color': '#E3E8E2'
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
      'fill-color': '#E3E8E2'
    }
  },

  {
    id: 'lakes',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'lakes',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#D0CFD4'
    }
  },

  {
    id: 'streams',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'streams',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#D0CFD4'
    }
  },

  {
    id: 'canals',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'canals',
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: {
      'fill-color': '#D0CFD4'
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
      'line-color': '#D5D5D5',
      'line-width': {
        base: 1.4,
        stops: [[12, 1.45], [14, 6], [18, 38]]
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
      'line-color': '#D5D5D5',
      'line-width': {
        base: 1.2,
        stops: [[10, 1.45], [14, 5], [18, 38]]
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
      'line-color': '#FFFFFF',
      'line-width': {
        base: 1.6,
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
      'line-color': '#FFFFFF',
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
      'line-color': '#FFFFFF',
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
      'fill-color': ['interpolate', ['linear'], ['zoom'], 13, '#E3E3E3', 16, '#DEDEDE', 17, '#D9D9D9', 18, '#D4D4D4']
    }
  },

  // {
  //   id: 'buildings-extrusion',
  //   type: 'fill-extrusion',
  //   source: 'basemap',
  //   'source-layer': 'buildings',
  //   minzoom: 13,
  //   paint: {
  //     'fill-extrusion-height': 20,
  //     'fill-extrusion-color': [
  //       'interpolate',
  //       ['linear'],
  //       ['zoom'],
  //       13,
  //       '#E3E3E3',
  //       16,
  //       '#DEDEDE',
  //       17,
  //       '#D9D9D9',
  //       18,
  //       '#D4D4D4'
  //     ]
  //   }
  // },

  {
    id: 'rail',
    type: 'line',
    metadata: {},
    source: 'basemap',
    'source-layer': 'railroads',
    paint: {
      'line-color': '#ddd',
      'line-width': {
        base: 1.4,
        stops: [[14, 0.4], [15, 0.75], [20, 2]]
      }
    }
  }
];

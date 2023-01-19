export let basemapLabels: any = [
  {
    id: 'highways_labels',
    type: 'symbol',
    source: 'basemap',
    'source-layer': 'road-sections',
    filter: [
      'all',
      ['==', ['get', 'classification'], 8],
      ['!=', ['get', 'name'], 'voie Non-nommée'],
      ['!=', ['get', 'name'], 'voie Privée']
    ],
    layout: {
      'text-font': ['OpenSans-SemiBold'],
      'text-transform': 'uppercase',
      'text-field': '{name}',
      'text-size': 10,
      'symbol-placement': 'line',
      'text-letter-spacing': 0.1
    },
    paint: {
      'text-color': '#B6B6B6',
      'text-halo-color': 'rgba(255,255,255,0.75)',
      'text-halo-width': 2
    }
  },
  {
    id: 'roads_labels',
    type: 'symbol',
    source: 'basemap',
    'source-layer': 'road-sections',
    filter: [
      'all',
      ['!=', ['get', 'classification'], 8],
      ['!=', ['get', 'name'], 'voie Non-nommée'],
      ['!=', ['get', 'name'], 'voie Privée']
    ],
    minzoom: 14,
    layout: {
      'text-font': ['OpenSans-Regular'],
      'text-field': '{name}',
      'text-size': 11,
      'symbol-placement': 'line',
      'text-letter-spacing': 0.1,
      'text-max-angle': 70
    },
    paint: {
      'text-color': '#878787',
      'text-halo-color': '#fff',
      'text-halo-width': 1,
      'text-halo-blur': 0.5
    }
  },

  {
    id: 'large_parks_labels',
    type: 'symbol',
    source: 'basemap',
    'source-layer': 'parks',
    filter: ['>=', ['get', 'SHAPE_AREA'], 150000],
    minzoom: 12,
    layout: {
      'text-anchor': 'center',
      'text-font': ['OpenSans-Regular'],
      'text-field': '{NOM_PARC}',
      'text-size': 11.5,
      'symbol-placement': 'point',
      'text-letter-spacing': 0.1,
      'text-padding': 60
    },
    paint: {
      'text-color': '#ABB2AA',
      'text-halo-color': '#fff',
      'text-halo-width': 1,
      'text-halo-blur': 0.5
    }
  },

  {
    id: 'small_parks_labels',
    type: 'symbol',
    source: 'basemap',
    'source-layer': 'parks',
    filter: ['<', ['get', 'SHAPE_AREA'], 150000],
    minzoom: 14.5,
    layout: {
      'text-anchor': 'center',
      'text-font': ['OpenSans-Regular'],
      'text-field': '{NOM_PARC}',
      'text-size': 11.5,
      'symbol-placement': 'point',
      'text-letter-spacing': 0.1,
      'text-padding': 30
    },
    paint: {
      'text-color': '#ABB2AA',
      'text-halo-color': '#fff',
      'text-halo-width': 1,
      'text-halo-blur': 0.5
    }
  },

  {
    id: 'boroughs_labels',
    type: 'symbol',
    source: 'basemap',
    'source-layer': 'boroughs-center',
    maxzoom: 14,
    layout: {
      'text-anchor': 'center',
      'text-font': ['OpenSans-Light'],
      'text-field': '{NOM_ARROND}',
      'text-transform': 'uppercase',
      'symbol-placement': 'point',
      'text-letter-spacing': 0.1,
      'text-size': 9
    },
    paint: {
      'text-color': '#2E2E2E',
      'text-halo-color': 'rgba(255,255,255,0.75)',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  },

  {
    id: 'cities_labels',
    type: 'symbol',
    source: 'basemap',
    'source-layer': 'cities-center',
    filter: ['!=', ['get', 'NOM_VILLE'], 'Montréal'],
    maxzoom: 14,
    layout: {
      'text-transform': 'uppercase',
      'text-anchor': 'center',
      'text-font': ['OpenSans-SemiBold'],
      'text-field': '{NOM_VILLE}',
      'text-size': 10.5,
      'symbol-placement': 'point',
      'text-letter-spacing': 0.1
    },
    paint: {
      'text-color': '#666',
      'text-halo-color': 'rgba(255,255,255,0.75)',
      'text-halo-width': 1,
      'text-halo-blur': 1
    }
  },

  {
    id: 'addresses_labels',
    type: 'symbol',
    source: 'basemap',
    'source-layer': 'addresses',
    minzoom: 17.5,
    layout: {
      'text-font': ['Montserrat-SemiBold'],
      'text-field': '#{JMAPTXT_MSG}',
      'text-rotate': {
        type: 'identity',
        property: 'JMAPTXT_ANG'
      },
      'text-size': 11.5,
      'text-letter-spacing': 0.1
    },
    paint: {
      'text-color': '#6E6E6E',
      'text-halo-color': 'rgba(255,255,255,0.75)',
      'text-halo-width': 0.5,
      'text-halo-blur': 1
    }
  }
];

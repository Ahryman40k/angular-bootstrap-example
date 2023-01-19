import { Layer } from 'mapbox-gl';

export let pi2016RoadSections: Layer[] = [
  {
    id: 'unified-road-sections-type',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'troncons-unifies',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-color': [
        'case',
        [
          'all',
          ['==', ['get', 'carteLegende2016'], 'Aucune intervention'],
          ['boolean', ['feature-state', 'unSelected'], true]
        ],
        '#999999',
        [
          'all',
          ['==', ['get', 'carteLegende2016'], '1 ou 2 actifs critiques dont au moins un en reconstruction'],
          ['boolean', ['feature-state', 'unSelected'], true]
        ],
        '#FA3411',
        [
          'all',
          ['==', ['get', 'carteLegende2016'], '3 actifs critiques dont au moins un en reconstruction '],
          ['boolean', ['feature-state', 'unSelected'], true]
        ],
        '#FA3411',
        [
          'all',
          [
            '==',
            ['get', 'carteLegende2016'],
            "Réhabilitation chaussée critique, sans réhabilitation de l'eau potable ni de l'égout"
          ]
        ],
        '#38A800',
        [
          'all',
          [
            '==',
            ['get', 'carteLegende2016'],
            "Réhabilitation de l'eau potable ou de l'égout, avec ou sans réhabilitation de chaussée"
          ],
          ['boolean', ['feature-state', 'unSelected'], true]
        ],
        '#0070FF',
        '#FFFF00'
      ],
      'line-width': [
        'match',
        ['get', 'carteLegende2016'],
        '3 actifs critiques dont au moins un en reconstruction ',
        8,
        4
      ]
    }
  }
];

/**
 * montreal:potable-water Eau potable - PI 2016
 * montreal:rain-water Eaux pluviales - PI 2016
 * montreal:waste-water Eaux usées - PI 2016
 * montreal:unified-road-nodes Noeuds - PI 2016
 * montreal:unified-road-sections Tronçons - PI 2016
 * montreal:road-network Voirie - PI 2016
 */
export let pi2016RoadNodes: any = [
  {
    id: 'unified-road-nodes',
    type: 'circle',
    source: 'PI-2016',
    'source-layer': 'noeuds-unifies',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'circle-radius': {
        base: 2,
        stops: [[13, 4], [14, 6], [15, 7], [16, 8], [17, 9]]
      },
      'circle-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(0,0,0,0.8)',
        'rgba(255,255,0, 1)'
      ]
    }
  }
];

export let pi2016RoadNetwork: any = [
  {
    id: 'road-network-type',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'voirie',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': [
        'case',
        ['all', ['==', ['get', 'sc2TypeIntervSigs'], 'Réhab.'], ['boolean', ['feature-state', 'unSelected'], true]],
        '#55FF00',
        ['all', ['==', ['get', 'sc2TypeIntervSigs'], 'Recon.'], ['boolean', ['feature-state', 'unSelected'], true]],
        '#008CA1',
        '#FFFF00'
      ]
    }
  },
  {
    id: 'road-network-critical',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'voirie',
    minzoom: 13,
    filter: ['all', ['==', ['get', 'actifCritiqueCourtTermeSda'], 'Oui']],
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-dasharray': [1, 1]
    }
  }
];

export let pi2016WasteWater: any = [
  {
    id: 'waste-water-type',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eaux-usees',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': ['match', ['get', 'sc2TypeIntervSigs'], 'Réhab.', '#E69800', 'Rempl.', '#A80084', 'black']
    }
  },
  {
    id: 'waste-water-critical',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eaux-usees',
    minzoom: 13,
    filter: ['all', ['==', ['get', 'actifCritiqueCourtTermeSda'], 'Oui']],
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-dasharray': [1, 1]
    }
  },
  {
    id: 'waste-water-query',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eaux-usees',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgb(255,255,0)'
      ]
    }
  }
];

export let pi2016RainWater: any = [
  {
    id: 'rain-water-type',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eaux-pluviales',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': ['match', ['get', 'sc2TypeIntervSigs'], 'Réhab.', '#FFD37E', 'Rempl.', '#FF73DF', 'black']
    }
  },
  {
    id: 'rain-water-critical',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eaux-pluviales',
    minzoom: 13,
    filter: ['all', ['==', ['get', 'actifCritiqueCourtTermeSda'], 'Oui']],
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': '#000000',
      'line-dasharray': [1, 1]
    }
  },
  {
    id: 'rain-water-query',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eaux-pluviales',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgb(255,255,0)'
      ]
    }
  }
];

export let pi2016PotableWater: any = [
  {
    id: 'potable-water-type',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eau-potable',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': ['match', ['get', 'sc2TypeIntervSigs'], 'Réhab.', '#00FFC5', 'Rempl.', '#73B2FF', 'black']
    }
  },
  {
    id: 'potable-water-critical',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eau-potable',
    minzoom: 13,
    filter: ['all', ['==', ['get', 'actifCritiqueCourtTermeSda'], 'Oui']],
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-dasharray': [1, 1]
    }
  },
  {
    id: 'potable-water-query',
    type: 'line',
    source: 'PI-2016',
    'source-layer': 'eau-potable',
    minzoom: 13,
    layout: { visibility: 'visible' },
    paint: {
      'line-width': 4,
      'line-color': [
        'case',
        ['boolean', ['feature-state', 'unSelected'], true],
        'rgba(255,255,255,0)',
        'rgb(255,255,0)'
      ]
    }
  }
];

import { Layer } from 'mapbox-gl';

export let streetTrees: Layer[] = [
  {
    id: 'street-trees',
    type: 'symbol',
    source: 'horticulture',
    'source-layer': 'arbres-sur-rue',
    layout: {
      'icon-image': 'tree-15',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    },
    minzoom: 16
  },
  {
    id: 'highlight-street-trees',
    type: 'symbol',
    source: 'horticulture',
    'source-layer': 'arbres-sur-rue',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    layout: {
      'icon-image': 'tree-15-highlight',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    },
    minzoom: 16
  }
];

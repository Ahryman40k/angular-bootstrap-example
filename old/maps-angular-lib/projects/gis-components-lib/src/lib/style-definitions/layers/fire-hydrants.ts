export let fireHydrants: any = [
  {
    id: 'fire-hydrants',
    type: 'symbol',
    source: 'water-assets',
    'source-layer': 'fire-hydrants',
    minzoom: 13,
    layout: {
      'icon-image': 'fire-hydrant-15',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  },
  {
    id: 'highlight-fire-hydrants',
    type: 'symbol',
    source: 'water-assets',
    'source-layer': 'fire-hydrants',
    minzoom: 13,
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    layout: {
      'icon-image': 'fire-hydrant-15-highlight',
      'icon-allow-overlap': true,
      'icon-ignore-placement': true,
      'icon-pitch-alignment': 'auto',
      'icon-keep-upright': true
    }
  }
];

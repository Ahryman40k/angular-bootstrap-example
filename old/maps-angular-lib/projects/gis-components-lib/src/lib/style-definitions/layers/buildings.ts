export let buildings: any = [
  {
    id: 'query-buildings',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'buildings',
    minzoom: 13,
    paint: {
      'fill-color': '#00FF00'
    }
  },
  {
    id: 'highlight-buildings',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'buildings',
    minzoom: 13,
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-color': '#FF0000'
    }
  },
  {
    id: 'hover-buildings',
    type: 'fill',
    source: 'basemap',
    'source-layer': 'buildings',
    minzoom: 13,
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-color': '#FF00FF'
    }
  }
];

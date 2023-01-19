import { Layer } from 'mapbox-gl';

const layersColors = {
  OVNI_REPORTS: {
    DEFAULT: '#ff0000', // RED
    HIGHLIGHT: '#ff6666', // Clear RED
    HIGHLIGHT_OUTLINE: '#ff2233',
    HOVER: '#0000ff', // Clear Blue
    HOVER_OUTLINE: '#0000ff' // Clear Blue
  }
};

export let ovniReportsLayers: Layer[] = [
  {
    id: 'query-ovni-reports',
    type: 'fill',
    source: 'ovniReportsSource',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': layersColors.OVNI_REPORTS.DEFAULT,
      'fill-opacity': 0
    }
  },
  {
    id: 'highlight-ovni-reports',
    type: 'fill',
    source: 'ovniReportsSource',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.OVNI_REPORTS.HIGHLIGHT,
      'fill-outline-color': layersColors.OVNI_REPORTS.HIGHLIGHT_OUTLINE
    }
  },
  {
    id: 'hover-ovni-reports',
    type: 'fill',
    source: 'ovniReportsSource',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.OVNI_REPORTS.HOVER,
      'fill-outline-color': layersColors.OVNI_REPORTS.HOVER_OUTLINE
    }
  }
];

import { Layer } from 'mapbox-gl';

const layersColors = {
  PAVEMENT: {
    DEFAULT: '#FFFFFF',
    HIGHLIGHT: '#00FF00',
    HIGHLIGHT_OUTLINE: '#000000',
    HOVER: '#FF00FF',
    HOVER_OUTLINE: '#000000'
  },
  INTERSECTIONS: {
    DEFAULT: '#FFFFFF',
    HIGHLIGHT: '#00FF00',
    HIGHLIGHT_OUTLINE: '#000000',
    HOVER: '#FF00FF',
    HOVER_OUTLINE: '#000000'
  },
  SIDEWALKS: {
    DEFAULT: '#FFFFFF',
    HIGHLIGHT: '#00FFFF',
    HIGHLIGHT_OUTLINE: '#000000',
    HOVER: '#FF0000',
    HOVER_OUTLINE: '#000000'
  }
};

export let pavementSections: Layer[] = [
  {
    id: 'query-pavement-sections',
    type: 'fill',
    source: 'roads',
    'source-layer': 'pavement-sections',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': layersColors.PAVEMENT.DEFAULT,
      'fill-opacity': 0
    }
  },
  {
    id: 'highlight-pavement-sections',
    type: 'fill',
    source: 'roads',
    'source-layer': 'pavement-sections',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.PAVEMENT.HIGHLIGHT,
      'fill-outline-color': layersColors.PAVEMENT.HIGHLIGHT_OUTLINE
    }
  },
  {
    id: 'hover-pavement-sections',
    type: 'fill',
    source: 'roads',
    'source-layer': 'pavement-sections',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.PAVEMENT.HOVER,
      'fill-outline-color': layersColors.PAVEMENT.HOVER_OUTLINE
    }
  }
];

export let intersections: Layer[] = [
  {
    id: 'query-intersections',
    type: 'fill',
    source: 'roads',
    'source-layer': 'intersections',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': layersColors.INTERSECTIONS.DEFAULT,
      'fill-opacity': 0
    }
  },
  {
    id: 'highlight-intersections',
    type: 'fill',
    source: 'roads',
    'source-layer': 'intersections',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.INTERSECTIONS.HIGHLIGHT,
      'fill-outline-color': layersColors.INTERSECTIONS.HIGHLIGHT_OUTLINE
    }
  },
  {
    id: 'hover-intersections',
    type: 'fill',
    source: 'roads',
    'source-layer': 'intersections',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.INTERSECTIONS.HOVER,
      'fill-outline-color': layersColors.INTERSECTIONS.HOVER_OUTLINE
    }
  }
];
export let sidewalks: Layer[] = [
  {
    id: 'query-sidewalks',
    type: 'fill',
    source: 'roads',
    'source-layer': 'sidewalks',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': layersColors.SIDEWALKS.DEFAULT,
      'fill-opacity': 0
    }
  },
  {
    id: 'highlight-sidewalks',
    type: 'fill',
    source: 'roads',
    'source-layer': 'sidewalks',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.SIDEWALKS.HIGHLIGHT,
      'fill-outline-color': layersColors.SIDEWALKS.HIGHLIGHT_OUTLINE
    }
  },
  {
    id: 'hover-sidewalks',
    type: 'fill',
    source: 'roads',
    'source-layer': 'sidewalks',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.75,
      'fill-color': layersColors.SIDEWALKS.HOVER,
      'fill-outline-color': layersColors.SIDEWALKS.HOVER_OUTLINE
    }
  }
];

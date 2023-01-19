import { Layer } from 'mapbox-gl';

const layersColors = {
  OCCUPANCY_ZONE: {
    DEFAULT: '#ff0000', // RED
    HIGHLIGHT: '#ffff00', // Clear RED
    HIGHLIGHT_OUTLINE: '#000000',
    HOVER: '#0000ff', // Clear Blue
    HOVER_OUTLINE: '#000000'
  }
};

export let occupancyZoneLayers: Layer[] = [
  {
    id: 'query-occupancy-zone',
    type: 'fill',
    source: 'occupancyZonesSource',
    filter: ['all', ['==', '$type', 'Polygon']],
    paint: {
      'fill-color': layersColors.OCCUPANCY_ZONE.DEFAULT,
      'fill-opacity': 0.5
    }
  },
  {
    id: 'highlight-occupancy-zone',
    type: 'fill',
    source: 'occupancyZonesSource',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.5,
      'fill-color': layersColors.OCCUPANCY_ZONE.HIGHLIGHT,
      'fill-outline-color': layersColors.OCCUPANCY_ZONE.HIGHLIGHT_OUTLINE
    }
  },
  {
    id: 'hover-occupancy-zone',
    type: 'fill',
    source: 'occupancyZonesSource',
    filter: ['all', ['match', ['to-string', ['get', 'id']], [''], true, false]],
    paint: {
      'fill-opacity': 0.5,
      'fill-color': layersColors.OCCUPANCY_ZONE.HOVER,
      'fill-outline-color': layersColors.OCCUPANCY_ZONE.HOVER_OUTLINE
    }
  }
];

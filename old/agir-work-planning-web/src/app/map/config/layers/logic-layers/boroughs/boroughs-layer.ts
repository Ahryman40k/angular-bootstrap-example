import { Layer } from 'mapbox-gl';

import { LayerType } from '../../layer-enums';
import { MapLayers, MapLayersSources } from '../../map-enums';
import { mapStyleConfig } from '../../styles';
import { MapLogicLayer } from '../map-logic-layer-enum';

const featureState = 'feature-state';
export const boroughs: Layer[] = [
  {
    id: 'boroughs-limits',
    type: LayerType.LINE,
    source: MapLayersSources.BASEMAP,
    minzoom: mapStyleConfig.boroughCount.maxZoom,
    'source-layer': MapLogicLayer.boroughs,
    paint: {
      'line-width': ['interpolate', ['exponential', 2], ['zoom'], 1, 2, mapStyleConfig.intervention.zoom, 5],
      'line-opacity': mapStyleConfig.boroughs.opacity,
      'line-color': mapStyleConfig.boroughs.color,
      'line-dasharray': mapStyleConfig.boroughs.lineDash
    }
  },
  {
    id: 'boroughs-limits-fill',
    type: LayerType.FILL,
    source: MapLayersSources.BASEMAP,
    maxzoom: mapStyleConfig.boroughCount.maxZoom,
    'source-layer': MapLogicLayer.boroughs,
    paint: {
      'fill-opacity': ['case', ['boolean', [featureState, 'hover'], false], 0.7, 0.3],
      'fill-color': [
        'case',
        ['boolean', [featureState, 'hover'], false],
        mapStyleConfig.boroughs.color,
        mapStyleConfig.boroughs.color
      ]
    }
  },
  {
    id: 'boroughs-limits-fill-halo',
    type: LayerType.LINE,
    source: MapLayersSources.BASEMAP,
    maxzoom: mapStyleConfig.boroughCount.maxZoom,
    'source-layer': MapLogicLayer.boroughs,
    paint: {
      'line-color': mapStyleConfig.boroughs.innerColor,
      'line-opacity': mapStyleConfig.boroughs.opacity
    }
  },
  {
    id: 'boroughs-linked-cities-overlay',
    type: LayerType.FILL,
    source: MapLayersSources.BASEMAP,
    'source-layer': MapLayers.CITIES,
    filter: ['all', ['!=', ['get', 'NOM_VILLE'], 'Montréal']],
    minzoom: mapStyleConfig.boroughCount.maxZoom,
    paint: {
      'fill-color': ['case', ['boolean', false], mapStyleConfig.colors.linkWater, mapStyleConfig.colors.linkWater],
      'fill-opacity': ['case', ['boolean', false], 0.7, 0.5]
    }
  },
  {
    id: 'boroughs-linked-cities-limits',
    type: LayerType.LINE,
    source: MapLayersSources.BASEMAP,
    'source-layer': MapLayers.CITIES,
    minzoom: mapStyleConfig.boroughCount.maxZoom,
    paint: {
      'line-width': ['interpolate', ['exponential', 2], ['zoom'], 1, 2, mapStyleConfig.intervention.zoom, 5],
      'line-opacity': mapStyleConfig.boroughs.opacity,
      'line-color': mapStyleConfig.boroughs.color,
      'line-dasharray': mapStyleConfig.boroughs.lineDash
    }
  },
  {
    id: 'boroughs-linked-cities',
    type: LayerType.FILL,
    source: MapLayersSources.BASEMAP,
    'source-layer': MapLayers.CITIES,
    filter: ['all', ['!=', ['get', 'NOM_VILLE'], 'Montréal']],
    maxzoom: mapStyleConfig.boroughCount.maxZoom,
    paint: {
      'fill-color': [
        'case',
        ['boolean', [featureState, 'hover'], false],
        mapStyleConfig.boroughs.color,
        mapStyleConfig.colors.lightGray
      ],
      'fill-opacity': ['case', ['boolean', [featureState, 'hover'], false], 0.7, 0.15]
    }
  }
];

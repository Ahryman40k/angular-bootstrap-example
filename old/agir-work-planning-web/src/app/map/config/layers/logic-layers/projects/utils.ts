import { LayerType } from '../../layer-enums';
import { MapLayersSources, ObjectPinType } from '../../map-enums';
import { mapStyleConfig } from '../../styles';

export function createProjectPinLayer(id: string, icon: string, filterType: ObjectPinType): mapboxgl.Layer {
  return {
    id,
    minzoom: mapStyleConfig.projectPins.minZoom,
    maxzoom: mapStyleConfig.projectPins.maxZoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: filterByType(filterType),
    layout: {
      'icon-image': icon,
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  };
}

export function createRtuProjectPinLayer(id: string, icon: string, filterType: ObjectPinType): mapboxgl.Layer {
  return {
    id,
    minzoom: mapStyleConfig.projectPins.minZoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: filterByType(filterType),
    layout: {
      'icon-image': icon,
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  };
}

export function filterByType(filterType: string): mapboxgl.Expression {
  return ['==', ['get', 'type'], filterType];
}

export function createProjectAreaLayers(id: string, color: string, pattern?: string): mapboxgl.Layer[] {
  const areaPaint: mapboxgl.FillPaint = {};
  if (!pattern) {
    areaPaint['fill-color'] = color;
    areaPaint['fill-opacity'] = ['case', ['get', '_highlighted'], mapStyleConfig.projectArea.area.opacity, 0.1];
  } else {
    areaPaint['fill-pattern'] = pattern;
    areaPaint['fill-opacity'] = ['case', ['get', '_highlighted'], mapStyleConfig.projectArea.area.opacity, 0.33];
  }
  return [
    {
      id,
      minzoom: mapStyleConfig.projectArea.minZoom,
      type: LayerType.FILL,
      source: `${id}-areas`,
      paint: areaPaint
    },
    {
      id: `${id}-area-halo`,
      minzoom: mapStyleConfig.projectArea.minZoom,
      type: LayerType.LINE,
      source: `${id}-areas`,
      layout: mapStyleConfig.layouts['line-rounded'],
      paint: {
        'line-width': 2,
        'line-color': color,
        'line-opacity': ['case', ['get', '_highlighted'], mapStyleConfig.projectArea.halo.opacity, 0.5]
      }
    }
  ];
}

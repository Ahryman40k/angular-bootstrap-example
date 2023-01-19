import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

export const roadways: Layer[] = [
  {
    id: MapLayers.PAVEMENT,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.PAVEMENT,
    filter: ['all', ['==', '$type', 'Polygon']],
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.roadway.color,
      'fill-outline-color': mapStyleConfig.asset.roadway.outlineColor
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.PAVEMENT}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.PAVEMENT,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.roadway.color,
      'fill-outline-color': mapStyleConfig.asset.roadway.outlineColor
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.PAVEMENT}`,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.PAVEMENT,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.roadway.lineWidth
    }
  },
  {
    id: MapLayers.INTERSECTIONS,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.INTERSECTIONS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.roadway.color
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.INTERSECTIONS}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.INTERSECTIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.roadway.color
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.INTERSECTIONS}`,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.INTERSECTIONS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.roadway.lineWidth
    }
  },
  {
    id: MapLayers.ILOTS,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.ILOTS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.sidewalk.color
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.ILOTS}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.ILOTS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.sidewalk.color
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.ILOTS}`,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.ILOTS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.roadway.lineWidth
    }
  }
];

export const sidewalk: Layer[] = [
  {
    id: MapLayers.SIDEWALKS,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.SIDEWALKS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.sidewalk.color,
      'fill-outline-color': mapStyleConfig.asset.sidewalk.color,
      'fill-opacity': mapStyleConfig.asset.sidewalk.opacity
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SIDEWALKS}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.SIDEWALKS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.sidewalk.color,
      'fill-outline-color': mapStyleConfig.asset.sidewalk.color,
      'fill-opacity': mapStyleConfig.asset.sidewalk.opacity
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SIDEWALKS}`,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.SIDEWALKS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.sidewalk.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SIDEWALKS}`,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.SIDEWALKS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.sidewalk.lineWidth
    }
  }
];

export const area: Layer[] = [
  {
    id: MapLayers.AREAS,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.AREAS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.asset.area.outlineColor,
      'line-width': mapStyleConfig.asset.area.lineWidth
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.AREAS}`,
    type: LayerType.FILL,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.AREAS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.area.color,
      'fill-outline-color': mapStyleConfig.asset.area.outlineColor,
      'fill-opacity': mapStyleConfig.asset.area.opacity
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.AREAS}`,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.AREAS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.area.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.AREAS}`,
    type: LayerType.LINE,
    source: MapLayersSources.VOIRIE,
    'source-layer': MapLayers.AREAS,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.area.lineWidth
    }
  }
];

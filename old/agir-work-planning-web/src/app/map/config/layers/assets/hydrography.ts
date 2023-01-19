import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { buildMatchExpressionFromAttribute, filterById, IKeyValueString } from '../utils';

const watercoursesDitchesAttributeName = mapStyleConfig.asset.watercoursesDitches.propertyKey;
const watercoursesDitchesKeysValues: IKeyValueString = {};
watercoursesDitchesKeysValues[mapStyleConfig.asset.watercoursesDitches.ditche.propertyValue] =
  mapStyleConfig.asset.watercoursesDitches.ditche.lineColor;
watercoursesDitchesKeysValues[mapStyleConfig.asset.watercoursesDitches.river.propertyValue] =
  mapStyleConfig.asset.watercoursesDitches.river.lineColor;
watercoursesDitchesKeysValues[mapStyleConfig.asset.watercoursesDitches.stream.propertyValue] =
  mapStyleConfig.asset.watercoursesDitches.stream.lineColor;
watercoursesDitchesKeysValues[mapStyleConfig.asset.watercoursesDitches.streamCanal.propertyValue] =
  mapStyleConfig.asset.watercoursesDitches.streamCanal.lineColor;

export const watercoursesDitches: Layer[] = [
  {
    id: MapLayers.WATERCOURSES_DITCHES,
    source: MapLayersSources.RESEAU_HYDROGRAPHIQUE,
    'source-layer': MapLayers.WATERCOURSES_DITCHES,
    minzoom: mapStyleConfig.asset.watercoursesDitches.zoom,
    type: LayerType.LINE,
    paint: {
      'line-color': buildMatchExpressionFromAttribute(watercoursesDitchesAttributeName, watercoursesDitchesKeysValues),
      'line-width': mapStyleConfig.asset.watercoursesDitches.lineWidth
    }
  },

  // stream canal dash-array
  {
    id: `${MapLayers.WATERCOURSES_DITCHES}-stream-canal-dash`,
    source: MapLayersSources.RESEAU_HYDROGRAPHIQUE,
    'source-layer': MapLayers.WATERCOURSES_DITCHES,
    minzoom: mapStyleConfig.asset.watercoursesDitches.zoom,
    type: LayerType.LINE,
    filter: [
      '==',
      ['get', mapStyleConfig.asset.watercoursesDitches.propertyKey],
      mapStyleConfig.asset.watercoursesDitches.streamCanal.propertyValue
    ],
    paint: {
      'line-color': mapStyleConfig.asset.watercoursesDitches.streamCanal.dashArrayColor,
      'line-width': mapStyleConfig.asset.watercoursesDitches.lineWidth,
      'line-dasharray': mapStyleConfig.asset.watercoursesDitches.streamCanal.dashArray
    }
  },

  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.WATERCOURSES_DITCHES}`,
    source: MapLayersSources.RESEAU_HYDROGRAPHIQUE,
    'source-layer': MapLayers.WATERCOURSES_DITCHES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.watercoursesDitches.zoom,
    type: LayerType.LINE,
    paint: {
      'line-color': buildMatchExpressionFromAttribute(watercoursesDitchesAttributeName, watercoursesDitchesKeysValues),
      'line-width': mapStyleConfig.asset.watercoursesDitches.lineWidth
    }
  },

  // PROJECT stream canal dash-array
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.WATERCOURSES_DITCHES}-stream-canal-dash`,
    source: MapLayersSources.RESEAU_HYDROGRAPHIQUE,
    'source-layer': MapLayers.WATERCOURSES_DITCHES,
    minzoom: mapStyleConfig.asset.watercoursesDitches.zoom,
    type: LayerType.LINE,
    filter: [
      '==',
      ['get', mapStyleConfig.asset.watercoursesDitches.propertyKey],
      mapStyleConfig.asset.watercoursesDitches.streamCanal.propertyValue
    ],
    paint: {
      'line-color': mapStyleConfig.asset.watercoursesDitches.streamCanal.dashArrayColor,
      'line-width': mapStyleConfig.asset.watercoursesDitches.lineWidth,
      'line-dasharray': mapStyleConfig.asset.watercoursesDitches.streamCanal.dashArray
    }
  },

  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.WATERCOURSES_DITCHES}`,
    source: MapLayersSources.RESEAU_HYDROGRAPHIQUE,
    'source-layer': MapLayers.WATERCOURSES_DITCHES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.watercoursesDitches.zoom,
    type: LayerType.LINE,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.watercoursesDitches.lineWidth
    }
  },

  {
    id: `${LayerPrefix.HOVER}-${MapLayers.WATERCOURSES_DITCHES}`,
    source: MapLayersSources.RESEAU_HYDROGRAPHIQUE,
    'source-layer': MapLayers.WATERCOURSES_DITCHES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.watercoursesDitches.zoom,
    type: LayerType.LINE,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.watercoursesDitches.lineWidth
    }
  }
];

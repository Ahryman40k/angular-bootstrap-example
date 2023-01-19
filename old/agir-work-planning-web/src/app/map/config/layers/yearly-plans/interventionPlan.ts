import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById, generateCircleByColor } from '../utils';

const { color, strokeColor, strokeWidth } = mapStyleConfig.yearlyPlan.unifiedNodes;
const { highlight, hover } = mapStyleConfig.colors;

export const drinkingWater: Layer[] = [
  {
    id: MapLayers.POTABLE_WATER,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.POTABLE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.drinkingWater.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.drinkingWater.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.POTABLE_WATER}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.POTABLE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.drinkingWater.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.drinkingWater.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.POTABLE_WATER}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.POTABLE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.yearlyPlan.drinkingWater.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.POTABLE_WATER}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.POTABLE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.yearlyPlan.drinkingWater.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  }
];

export const wasteWaters: Layer[] = [
  {
    id: MapLayers.WASTE_WATER,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.WASTE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.wasteWaters.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.wasteWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.WASTE_WATER}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.WASTE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.wasteWaters.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.wasteWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.WASTE_WATER}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.WASTE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.yearlyPlan.wasteWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.WASTE_WATER}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.WASTE_WATER,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.yearlyPlan.wasteWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  }
];

export const rainyWaters: Layer[] = [
  {
    id: MapLayers.RAINY_WATER,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.RAINY_WATER,
    minzoom: mapStyleConfig.yearlyPlan.rainyWaters.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.rainyWaters.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.rainyWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.RAINY_WATER}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.RAINY_WATER,
    minzoom: mapStyleConfig.yearlyPlan.rainyWaters.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.rainyWaters.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.rainyWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.RAINY_WATER}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.RAINY_WATER,
    minzoom: mapStyleConfig.yearlyPlan.rainyWaters.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.yearlyPlan.rainyWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.RAINY_WATER}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.RAINY_WATER,
    minzoom: mapStyleConfig.yearlyPlan.rainyWaters.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.yearlyPlan.rainyWaters.lineWidth,
      'line-dasharray': mapStyleConfig.yearlyPlan.drinkingWater.dashArray
    }
  }
];

export const unifiedNodes: Layer[] = [
  {
    id: MapLayers.UNIFIED_NODES,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_NODES,
    type: LayerType.CIRCLE,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: generateCircleByColor({ color, strokeColor, strokeWidth })
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.UNIFIED_NODES}`,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_NODES,
    type: LayerType.CIRCLE,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: generateCircleByColor({ color, strokeColor, strokeWidth })
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.UNIFIED_NODES}`,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_NODES,
    type: LayerType.CIRCLE,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: generateCircleByColor({ color: highlight, strokeColor: highlight, strokeWidth })
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.UNIFIED_NODES}`,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.UNIFIED_NODES,
    type: LayerType.CIRCLE,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: generateCircleByColor({ color, strokeColor: hover, strokeWidth })
  }
];

export const road: Layer[] = [
  {
    id: MapLayers.ROAD,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.ROAD,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.road.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.road.lineWidth
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.ROAD}`,
    type: LayerType.LINE,
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.ROAD,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.yearlyPlan.road.lineColor,
      'line-width': mapStyleConfig.yearlyPlan.road.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.ROAD}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.ROAD,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.yearlyPlan.road.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.ROAD}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.PLAN_INTERVENTION_2016,
    'source-layer': MapLayers.ROAD,
    minzoom: mapStyleConfig.yearlyPlan.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.yearlyPlan.road.lineWidth
    }
  }
];

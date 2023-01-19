import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers, createCompleteSymbolLayers, filterById, generateLayoutByIconImage } from '../utils';

export const aqueductSegment: Layer[] = createCompleteLineLayers(
  MapLayers.AQUEDUCS,
  MapLayersSources.AQUEDUCS,
  mapStyleConfig.asset.aqueducts
);

export const aqueductEntranceSegments: Layer[] = [
  {
    id: MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS,
    type: LayerType.LINE,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.asset.aqueducts.lineColor,
      'line-width': mapStyleConfig.asset.aqueducts.lineWidth
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS}`,
    type: LayerType.LINE,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS,
    filter: filterById(FilterId.noGeoSegment),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.asset.aqueducts.lineColor,
      'line-width': mapStyleConfig.asset.aqueducts.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS}`,
    type: LayerType.LINE,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS,
    filter: filterById(FilterId.noGeoSegment),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.aqueducts.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS}`,
    type: LayerType.LINE,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_ENTRANCES_SEGMENTS,
    filter: filterById(FilterId.noGeoSegment),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.asset.aqueducts.lineColor,
      'line-width': mapStyleConfig.asset.aqueducts.lineWidth,
      'line-gap-width': mapStyleConfig.asset.aqueducts.hover.lineGapWidth
    }
  }
];

export const aqueductJoins: Layer[] = [
  {
    id: MapLayers.AQUEDUCT_JOIN,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayersSources.RACCORDS_AQUEDUC,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${MapLayers.AQUEDUCT_JOIN}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.AQUEDUCT_JOIN}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayersSources.RACCORDS_AQUEDUC,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoJoin),
    layout: generateLayoutByIconImage(`${MapLayers.AQUEDUCT_JOIN}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.AQUEDUCT_JOIN}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayersSources.RACCORDS_AQUEDUC,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoJoin),
    layout: generateLayoutByIconImage(`${MapLayers.AQUEDUCT_JOIN} s`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.AQUEDUCT_JOIN}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayersSources.RACCORDS_AQUEDUC,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoJoin),
    layout: generateLayoutByIconImage(`${MapLayers.AQUEDUCT_JOIN} h`),
    minzoom: mapStyleConfig.asset.zoom
  }
];

export const aqueductValves: Layer[] = [
  {
    id: MapLayers.VALVES,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.VALVES,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${MapLayers.VALVES}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.VALVES}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.VALVES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoValve),
    layout: generateLayoutByIconImage(`${MapLayers.VALVES}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.VALVES}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.VALVES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoValve),
    layout: generateLayoutByIconImage(`${MapLayers.VALVES} s`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.VALVES}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.VALVES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoValve),
    layout: generateLayoutByIconImage(`${MapLayers.VALVES} h`),
    minzoom: mapStyleConfig.asset.zoom
  }
];

export const aqueductValveChambers: Layer[] = [
  {
    id: MapLayers.AQUEDUCTS_VALVE_CHAMBERS,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_VALVE_CHAMBERS,
    minzoom: mapStyleConfig.asset.zoom,
    type: LayerType.FILL,
    paint: {
      'fill-color': mapStyleConfig.asset.aqueducts.valveChamber.color
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.AQUEDUCTS_VALVE_CHAMBERS}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_VALVE_CHAMBERS,
    minzoom: mapStyleConfig.asset.zoom,
    type: LayerType.FILL,
    filter: filterById(FilterId.noGeoChamber),
    paint: {
      'fill-color': mapStyleConfig.asset.aqueducts.valveChamber.color
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.AQUEDUCTS_VALVE_CHAMBERS}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_VALVE_CHAMBERS,
    type: LayerType.LINE,
    filter: filterById(FilterId.noGeoChamber),
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.aqueducts.valveChamber.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.AQUEDUCTS_VALVE_CHAMBERS}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.AQUEDUCTS_VALVE_CHAMBERS,
    type: LayerType.LINE,
    filter: filterById(FilterId.noGeoChamber),
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.aqueducts.valveChamber.lineWidth
    },
    minzoom: mapStyleConfig.asset.zoom
  }
];

const WATER_SERVICE_ENTRANCE_ICON = 'entre_eau';

export const waterServiceEntrance: Layer[] = [
  {
    id: MapLayers.WATER_SERVICE_ENTRANCES,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.WATER_SERVICE_ENTRANCES,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${WATER_SERVICE_ENTRANCE_ICON}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.WATER_SERVICE_ENTRANCES}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.WATER_SERVICE_ENTRANCES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoValve),
    layout: generateLayoutByIconImage(`${WATER_SERVICE_ENTRANCE_ICON}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.WATER_SERVICE_ENTRANCES}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.WATER_SERVICE_ENTRANCES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoValve),
    layout: generateLayoutByIconImage(`${WATER_SERVICE_ENTRANCE_ICON}_s`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.WATER_SERVICE_ENTRANCES}`,
    source: MapLayersSources.AQUEDUCS,
    'source-layer': MapLayers.WATER_SERVICE_ENTRANCES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoValve),
    layout: generateLayoutByIconImage(`${WATER_SERVICE_ENTRANCE_ICON}_h`),
    minzoom: mapStyleConfig.asset.zoom
  }
];

export const aqueductAccessory: Layer[] = [
  ...createCompleteSymbolLayers(
    MapLayers.AQUEDUCTS_ACCESSORIES,
    MapLayersSources.AQUEDUCS,
    mapStyleConfig.asset.aqueductAccessory
  )
];

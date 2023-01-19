import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers, filterById, generateLayoutByIconImage } from '../utils';

export const sewers: Layer[] = createCompleteLineLayers(
  MapLayers.SEWERS,
  MapLayersSources.EGOUTS,
  mapStyleConfig.asset.sewer
);

export const sewerChambers: Layer[] = [
  {
    id: MapLayers.SEWERS_CHAMBERS,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_CHAMBERS,
    type: LayerType.FILL,
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.sewer.chambers.color
    }
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SEWERS_CHAMBERS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_CHAMBERS,
    type: LayerType.FILL,
    filter: filterById(FilterId.noGeoChamber),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'fill-color': mapStyleConfig.asset.sewer.chambers.color
    }
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SEWERS_CHAMBERS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_CHAMBERS,
    type: LayerType.LINE,
    filter: filterById(FilterId.noGeoChamber),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.asset.sewer.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SEWERS_CHAMBERS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_CHAMBERS,
    type: LayerType.LINE,
    filter: filterById(FilterId.noGeoChamber),
    minzoom: mapStyleConfig.asset.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.hover,
      'line-width': mapStyleConfig.asset.sewer.lineWidth
    }
  }
];

const REGARD_EGOUT_ICONS = 'regard_egout';

export const sewerManhole: Layer[] = [
  {
    id: MapLayers.SEWERS_MANHOLES,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_MANHOLES,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(REGARD_EGOUT_ICONS),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SEWERS_MANHOLES}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_MANHOLES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoSewerManhole),
    layout: generateLayoutByIconImage(REGARD_EGOUT_ICONS),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SEWERS_MANHOLES}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_MANHOLES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoSewerManhole),
    layout: generateLayoutByIconImage(`${REGARD_EGOUT_ICONS}_s`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SEWERS_MANHOLES}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_MANHOLES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoSewerManhole),
    layout: generateLayoutByIconImage(`${REGARD_EGOUT_ICONS}_h`),
    minzoom: mapStyleConfig.asset.zoom
  }
];

const RACCORDS_EGOUTS_ICONS = `raccord_egout`;

export const sewerJoins: Layer[] = [
  {
    id: MapLayers.SEWERS_JOINS,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_JOINS,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${RACCORDS_EGOUTS_ICONS}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SEWERS_JOINS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_JOINS,
    filter: filterById(FilterId.noGeoJoin),
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${RACCORDS_EGOUTS_ICONS}`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SEWERS_JOINS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_JOINS,
    filter: filterById(FilterId.noGeoJoin),
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${RACCORDS_EGOUTS_ICONS} s`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SEWERS_JOINS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_JOINS,
    filter: filterById(FilterId.noGeoJoin),
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${RACCORDS_EGOUTS_ICONS} h`),
    minzoom: mapStyleConfig.asset.zoom
  }
];

const PUISARD_ICONS = 'puisard';

export const sewerSumps: Layer[] = [
  {
    id: MapLayers.SEWERS_SUMPS,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_SUMPS,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(PUISARD_ICONS),
    minzoom: mapStyleConfig.asset.zoom
  },

  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SEWERS_SUMPS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_SUMPS,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoSump),
    layout: generateLayoutByIconImage(PUISARD_ICONS),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SEWERS_SUMPS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_SUMPS,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoSump),
    layout: generateLayoutByIconImage(`${PUISARD_ICONS} s`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SEWERS_SUMPS}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_SUMPS,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoSump),
    layout: generateLayoutByIconImage(`${PUISARD_ICONS} h`),
    minzoom: mapStyleConfig.asset.zoom
  }
];

const ACCESSORY_SEWER_ICON = 'accessoire_egout';

export const sewerAccessory: Layer[] = [
  {
    id: MapLayers.SEWERS_ACCESSORIES,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_ACCESSORIES,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(ACCESSORY_SEWER_ICON),
    minzoom: mapStyleConfig.asset.zoom
  },

  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.SEWERS_ACCESSORIES}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_ACCESSORIES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoAccessory),
    layout: generateLayoutByIconImage(ACCESSORY_SEWER_ICON),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.SEWERS_ACCESSORIES}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_ACCESSORIES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoAccessory),
    layout: generateLayoutByIconImage(`${ACCESSORY_SEWER_ICON}_s`),
    minzoom: mapStyleConfig.asset.zoom
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.SEWERS_ACCESSORIES}`,
    source: MapLayersSources.EGOUTS,
    'source-layer': MapLayers.SEWERS_ACCESSORIES,
    type: LayerType.SYMBOL,
    filter: filterById(FilterId.noGeoAccessory),
    layout: generateLayoutByIconImage(`${ACCESSORY_SEWER_ICON}_h`),
    minzoom: mapStyleConfig.asset.zoom
  }
];

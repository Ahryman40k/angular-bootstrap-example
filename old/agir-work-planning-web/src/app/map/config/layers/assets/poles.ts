import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import {
  createCompleteSymbolLayers,
  filterById,
  generateLayoutByIconImage,
  generateLayoutByIconsImages,
  IKeyValueString
} from '../utils';

const POLES_ICON = 'poteau';

export const poles: Layer[] = [
  {
    id: MapLayers.POLES,
    source: MapLayersSources.SIGNALISATION_ENTRAVES,
    'source-layer': MapLayers.POLES,
    minzoom: mapStyleConfig.asset.poles.zoom,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${POLES_ICON}`)
  },
  {
    id: `${LayerPrefix.PROJECT}-${MapLayers.POLES}`,
    source: MapLayersSources.SIGNALISATION_ENTRAVES,
    'source-layer': MapLayers.POLES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.poles.zoom,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${POLES_ICON}`)
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.POLES}`,
    source: MapLayersSources.SIGNALISATION_ENTRAVES,
    'source-layer': MapLayers.POLES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.poles.zoom,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${POLES_ICON} s`)
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.POLES}`,
    source: MapLayersSources.SIGNALISATION_ENTRAVES,
    'source-layer': MapLayers.POLES,
    filter: filterById(FilterId.id),
    minzoom: mapStyleConfig.asset.poles.zoom,
    type: LayerType.SYMBOL,
    layout: generateLayoutByIconImage(`${POLES_ICON} h`)
  }
];

const INT_LOGICAL_WITH_CONTROL = 'feuaveccont';
const INT_LOGICAL_WITHOUT_CONTROL = 'feusanscont';
const INT_LOGICAL_WITHOUT_LIGHT = 'intsansfeu';
const intLogicalAttributeValue = mapStyleConfig.asset.intLogical.propertyKey;
const iconValues: IKeyValueString = mapStyleConfig.asset.intLogical.iconKeys;

export const intLogical: Layer[] = [
  ...createCompleteSymbolLayers(
    MapLayers.INT_LOGICAL_CIRCULE_NODE,
    MapLayersSources.SIGNALISATION_ENTRAVES,
    mapStyleConfig.asset.intLogical
  )
];

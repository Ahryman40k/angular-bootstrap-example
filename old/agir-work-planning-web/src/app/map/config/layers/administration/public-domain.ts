import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { LayerPrefix, LayerType } from '../layer-enums';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { filterById } from '../utils';

export const legalCadastre: Layer[] = [
  {
    id: MapLayers.LEGAL_CADASTRE,
    type: LayerType.LINE,
    source: MapLayersSources.CADASTRE_QUEBEC,
    'source-layer': MapLayers.LEGAL_CADASTRE,
    paint: {
      'line-color': mapStyleConfig.publicDomain.legalCadastre.color,
      'line-width': mapStyleConfig.publicDomain.legalCadastre.lineWidth
    },
    minzoom: mapStyleConfig.publicDomain.zoom
  },
  {
    id: `${LayerPrefix.HIGHLIGHT}-${MapLayers.LEGAL_CADASTRE}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.CADASTRE_QUEBEC,
    'source-layer': MapLayers.LEGAL_CADASTRE,
    minzoom: mapStyleConfig.publicDomain.zoom,
    paint: {
      'line-color': mapStyleConfig.colors.highlight,
      'line-width': mapStyleConfig.publicDomain.legalCadastre.lineWidth
    }
  },
  {
    id: `${LayerPrefix.HOVER}-${MapLayers.LEGAL_CADASTRE}`,
    type: LayerType.LINE,
    filter: filterById(FilterId.id),
    source: MapLayersSources.CADASTRE_QUEBEC,
    'source-layer': MapLayers.LEGAL_CADASTRE,
    minzoom: mapStyleConfig.publicDomain.zoom,
    paint: {
      'line-color': mapStyleConfig.publicDomain.legalCadastre.color,
      'line-width': mapStyleConfig.publicDomain.legalCadastre.lineWidth
    }
  }
];

export const lotNumber: Layer[] = [
  {
    id: MapLayers.LOTS_NUMBERS,
    source: MapLayersSources.CADASTRE_QUEBEC,
    'source-layer': MapLayers.LOTS_NUMBERS,
    type: LayerType.SYMBOL,
    minzoom: mapStyleConfig.publicDomain.zoom,
    layout: {
      'text-font': ['OpenSans-Regular'],
      'text-field': '{jmaptxtMsg}',
      'text-size': ['interpolate', ['exponential', 2], ['zoom'], 10, 10, 21, 30],
      'symbol-placement': 'point',
      'text-letter-spacing': 0,
      'text-max-angle': 70,
      'text-rotate': {
        type: 'identity',
        property: 'jmaptxtAng'
      }
    },
    paint: {
      'text-color': mapStyleConfig.publicDomain.lotNumber.color
    }
  }
];

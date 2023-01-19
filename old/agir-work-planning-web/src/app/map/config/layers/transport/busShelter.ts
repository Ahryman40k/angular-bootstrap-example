import { Layer } from 'mapbox-gl';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteSymbolLayers } from '../utils';

export const busShelter: Layer[] = [
  ...createCompleteSymbolLayers(
    MapLayers.BUS_SHELTER,
    MapLayersSources.TRANSPORT_COMMUN,
    mapStyleConfig.asset.busShelter
  )
];

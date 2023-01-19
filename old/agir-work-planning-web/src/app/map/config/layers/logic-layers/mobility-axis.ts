import { Layer } from 'mapbox-gl';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers } from '../utils';

export const mobilityAxis: Layer[] = [
  ...createCompleteLineLayers(
    MapLayers.MOBILITY_AXIS,
    MapLayersSources.SIGNALISATION_ENTRAVES,
    mapStyleConfig.asset.mobilityAxis
  )
];

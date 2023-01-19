import { Layer } from 'mapbox-gl';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers } from '../utils';

export const track: Layer[] = [
  ...createCompleteLineLayers(MapLayers.TRACKS, MapLayersSources.RESEAU_FERROVIAIRE, mapStyleConfig.asset.track)
];

import { Layer } from 'mapbox-gl';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompleteLineLayers } from '../utils';

export const shoppingStreet: Layer[] = [
  ...createCompleteLineLayers(
    MapLayers.SHOPPING_STREETS,
    MapLayersSources.RESEAU_ROUTIER,
    mapStyleConfig.asset.shoppingStreet
  )
];

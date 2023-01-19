import { Layer } from 'mapbox-gl';

import { FilterId } from '../filter-enum';
import { MapLayers, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';
import { createCompletePolygonLayers } from '../utils';

export const leadGround: Layer[] = [
  ...createCompletePolygonLayers(
    MapLayers.LEAD_GROUNDS,
    MapLayersSources.EAU_INSPECTION_PERMIS,
    mapStyleConfig.asset.leadGround,
    true
  )
];

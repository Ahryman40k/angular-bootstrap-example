import { MapLogicLayer } from '../config/layers/logic-layers/map-logic-layer-enum';
import { MapLayers, MapLayersSources } from '../config/layers/map-enums';

export interface IHoverLayerConfig {
  layerId: string;
  source: string;
  sourceLayer?: string;
  hoveredId?: string;
}

export const hoverLayerConfigs: IHoverLayerConfig[] = [
  {
    layerId: 'boroughs-limits-fill',
    source: MapLayersSources.BASEMAP,
    sourceLayer: MapLogicLayer.boroughs,
    hoveredId: null
  },
  { layerId: 'count-by-borough-point', source: 'count-by-borough', hoveredId: null },
  { layerId: 'count-by-borough-point-hover', source: 'count-by-borough', hoveredId: null },
  {
    layerId: 'boroughs-linked-cities',
    source: MapLayersSources.BASEMAP,
    sourceLayer: MapLayers.CITIES,
    hoveredId: null
  },
  { layerId: 'count-by-city-point', source: 'count-by-city', hoveredId: null },
  { layerId: 'count-by-city-point-hover', source: 'count-by-city', hoveredId: null }
];

export const roadSectionConfig = {
  layerId: 'roads-section-selection',
  source: 'basemap-light',
  sourceLayer: 'road-sections',
  hoveredId: null
};

export const hoverRoadSectionConfig = {
  layerId: 'hover-roads-section-selection',
  source: MapLayersSources.ROAD_SECTION_HOVER,
  hoveredId: null
};

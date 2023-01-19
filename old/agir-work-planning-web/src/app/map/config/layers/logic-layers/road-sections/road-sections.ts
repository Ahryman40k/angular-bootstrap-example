import { Layer } from 'mapbox-gl';

import { MapLayersSources } from '../../map-enums';
import { createRoadSectionLayer } from '../../utils';

export const roadSectionsSelection: Layer[] = [
  createRoadSectionLayer('roads-section-selection', 'basemap-light', 'road-sections'),
  createRoadSectionLayer('highlight-roads-section-selection', MapLayersSources.ROAD_SECTION_HIGHLIGHT),
  createRoadSectionLayer('hover-roads-section-selection', MapLayersSources.ROAD_SECTION_HOVER)
];

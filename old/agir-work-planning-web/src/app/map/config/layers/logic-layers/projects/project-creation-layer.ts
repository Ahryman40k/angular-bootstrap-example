import { Layer } from 'mapbox-gl';

import { LayerType } from '../../layer-enums';
import { MapLayersSources } from '../../map-enums';
import { mapStyleConfig } from '../../styles';

export const projectCreation: Layer[] = [
  {
    id: 'project-areas-creation',
    type: LayerType.FILL,
    source: MapLayersSources.PROJECT_CREATION_AREAS,
    paint: {
      'fill-color': mapStyleConfig.colors.lightGray,
      'fill-opacity': mapStyleConfig.projectArea.area.opacity
    }
  }
];

import { Layer } from 'mapbox-gl';
import { enumValues } from 'src/app/shared/utils/utils';

import { LayerType } from '../layer-enums';
import { CriteriaIndex, MapLayersSources } from '../map-enums';
import { mapStyleConfig } from '../styles';

export const circleComparison: Layer[] = enumValues<CriteriaIndex>(CriteriaIndex).map(el => {
  return {
    id: `${MapLayersSources.CIRCLE_COMPARISON}-${el}`,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.CIRCLE_COMPARISON,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'criteriaIndex'], el],
    layout: {
      'icon-image': el,
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  };
});

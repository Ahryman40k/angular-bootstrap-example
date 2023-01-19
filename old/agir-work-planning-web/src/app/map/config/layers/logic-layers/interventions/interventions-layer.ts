import { Layer } from 'mapbox-gl';

import { LayerGeometryType, LayerType } from '../../layer-enums';
import { MapLayersSources, ObjectPinType } from '../../map-enums';
import { mapStyleConfig } from '../../styles';
import { filterByGeometryType } from '../../utils';
const lineRounded = 'line-rounded';
export const interventions: Layer[] = [
  {
    id: MapLayersSources.INTERVENTION_AREAS,
    type: LayerType.FILL,
    source: MapLayersSources.INTERVENTION_AREAS,
    paint: {
      'fill-color': mapStyleConfig.intervention.color,
      'fill-opacity': mapStyleConfig.intervention.area.opacity
    }
  },
  {
    id: `${MapLayersSources.INTERVENTION_AREAS}-border`,
    type: LayerType.LINE,
    source: MapLayersSources.INTERVENTION_AREAS,
    layout: mapStyleConfig.layouts[lineRounded],
    paint: {
      'line-width': 2,
      'line-color': mapStyleConfig.intervention.color,
      'line-opacity': mapStyleConfig.intervention.halo.opacity
    }
  },
  {
    id: MapLayersSources.INTERVENTION_AREAS_SECONDARY,
    type: LayerType.FILL,
    source: MapLayersSources.INTERVENTION_AREAS_SECONDARY,
    paint: {
      'fill-color': mapStyleConfig.intervention.color,
      'fill-opacity': mapStyleConfig.fill.opacity.secondary
    }
  },
  {
    id: `${MapLayersSources.INTERVENTION_AREAS_SECONDARY}-border`,
    type: LayerType.LINE,
    source: MapLayersSources.INTERVENTION_AREAS_SECONDARY,
    layout: mapStyleConfig.layouts[lineRounded],
    paint: {
      'line-width': 2,
      'line-color': mapStyleConfig.intervention.color,
      'line-opacity': mapStyleConfig.border.opacity.secondary
    }
  },
  {
    id: MapLayersSources.INTERVENTION_AREAS_SECONDARY_DECISION_REQUIRED,
    type: LayerType.FILL,
    source: MapLayersSources.INTERVENTION_AREAS_SECONDARY_DECISION_REQUIRED,
    paint: {
      'fill-color': mapStyleConfig.intervention.color,
      'fill-opacity': mapStyleConfig.fill.opacity.secondary
    }
  },
  {
    id: 'intervention-areas-secondary-border-decision-required',
    type: LayerType.LINE,
    source: MapLayersSources.INTERVENTION_AREAS_SECONDARY_DECISION_REQUIRED,
    layout: mapStyleConfig.layouts[lineRounded],
    paint: {
      'line-width': 2,
      'line-color': mapStyleConfig.intervention.color,
      'line-opacity': mapStyleConfig.border.opacity.secondary
    }
  },
  {
    id: 'intervention-points-halo',
    source: MapLayersSources.INTERVENTION_HALO,
    type: LayerType.CIRCLE,
    minzoom: mapStyleConfig.asset.zoom,
    filter: filterByGeometryType(LayerGeometryType.POINT),
    paint: {
      'circle-color': mapStyleConfig.intervention.color,
      'circle-radius': 20,
      'circle-blur': 1,
      'circle-opacity': mapStyleConfig.intervention.halo.opacity
    }
  },
  {
    id: 'intervention-lines-halo',
    minzoom: mapStyleConfig.asset.zoom,
    type: LayerType.LINE,
    source: MapLayersSources.INTERVENTION_HALO,
    filter: filterByGeometryType(LayerGeometryType.LINE_STRING),
    paint: {
      'line-width': 12,
      'line-color': mapStyleConfig.intervention.color,
      'line-opacity': mapStyleConfig.intervention.halo.opacity,
      'line-blur': 6
    }
  },
  {
    id: 'intervention-polygon-halo',
    minzoom: mapStyleConfig.asset.zoom,
    type: LayerType.LINE,
    source: MapLayersSources.INTERVENTION_HALO,
    filter: filterByGeometryType(LayerGeometryType.POLYGON),
    paint: {
      'line-width': 8,
      'line-color': mapStyleConfig.intervention.color,
      'line-opacity': mapStyleConfig.intervention.halo.opacity,
      'line-blur': 6
    }
  },
  {
    id: MapLayersSources.INTERVENTION_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.intervention],
    layout: {
      'icon-image': 'intervention-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  },
  {
    id: MapLayersSources.DECISION_REQUIRED_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.decisionRequiredIntervention],
    layout: {
      'icon-image': 'decision-required-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  },
  {
    id: MapLayersSources.INTERVENTION_REFUSED_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.interventionRefused],
    layout: {
      'icon-image': 'intervention-refused-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  },
  {
    id: MapLayersSources.INTERVENTION_ACCEPTED_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.interventionAccepted],
    layout: {
      'icon-image': 'intervention-accepted-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  },
  {
    id: MapLayersSources.INTERVENTION_CANCELED_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.interventionCanceled],
    layout: {
      'icon-image': 'intervention-canceled-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  },
  {
    id: MapLayersSources.DECISION_REQUIRED_NOT_WISHED_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.decisionRequiredNotWishedIntervention],
    layout: {
      'icon-image': 'decision-required-not-wished-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  },
  {
    id: MapLayersSources.DECISION_REQUIRED_WISHED_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.decisionRequiredWishedIntervention],
    layout: {
      'icon-image': 'decision-required-wished-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  },
  {
    id: MapLayersSources.DECISION_NOT_REQUIRED_WAITING_PINS,
    minzoom: mapStyleConfig.intervention.pins.zoom,
    source: MapLayersSources.OBJECT_PINS,
    type: LayerType.SYMBOL,
    filter: ['==', ['get', 'type'], ObjectPinType.decisionNotRequiredWaitingIntervention],
    layout: {
      'icon-image': 'decision-not-required-waiting-pin',
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true
    },
    paint: {
      'icon-opacity': mapStyleConfig.pins.opacity
    }
  }
];

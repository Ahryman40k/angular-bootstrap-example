import { MapLayersSources } from '../../map-enums';
import { InterventionCreationLayer } from './interventions-creation-layer';

export const mapInterventionLayerIds = [
  MapLayersSources.INTERVENTION_AREAS,
  `${MapLayersSources.INTERVENTION_AREAS}-border`,
  MapLayersSources.INTERVENTION_AREAS_SECONDARY,
  `${MapLayersSources.INTERVENTION_AREAS_SECONDARY}-border`,
  MapLayersSources.INTERVENTION_AREAS_SECONDARY_DECISION_REQUIRED,
  'intervention-areas-secondary-border-decision-required',
  'intervention-points-halo',
  'intervention-lines-halo',
  'intervention-polygon-halo',
  MapLayersSources.INTERVENTION_PINS,
  MapLayersSources.DECISION_REQUIRED_PINS
];

export const mapInterventionCreationLayerIds = [
  InterventionCreationLayer.areas,
  InterventionCreationLayer.pointsHalo,
  InterventionCreationLayer.pointsHalo,
  InterventionCreationLayer.polygonHalo
];

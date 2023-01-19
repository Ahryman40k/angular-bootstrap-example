import { Layer } from 'mapbox-gl';

import { MapLayersSources } from '../../map-enums';
import { mapStyleConfig } from '../../styles';

export enum InterventionCreationLayer {
  areas = 'intervention-creation-areas',
  pointsHalo = 'intervention-creation-points-halo',
  linesHalo = 'intervention-creation-lines-halo',
  polygonHalo = 'intervention-creation-polygon-halo'
}
const geometryType = 'geometry-type';
export const interventionCreation: Layer[] = [
  {
    id: InterventionCreationLayer.areas,
    source: MapLayersSources.INTERVENTION_CREATION_AREAS,
    minzoom: mapStyleConfig.intervention.zoomCreation,
    type: 'fill',
    paint: {
      'fill-color': mapStyleConfig.intervention.color,
      'fill-opacity': mapStyleConfig.intervention.area.opacity
    }
  },
  {
    id: InterventionCreationLayer.pointsHalo,
    minzoom: mapStyleConfig.asset.zoom,
    type: 'circle',
    source: MapLayersSources.INTERVENTION_CREATION_HALO,
    filter: ['==', [geometryType], 'Point'],
    paint: {
      'circle-color': mapStyleConfig.colors.pink,
      'circle-radius': 20,
      'circle-blur': 1,
      'circle-opacity': mapStyleConfig.intervention.halo.opacity
    }
  },
  {
    id: InterventionCreationLayer.linesHalo,
    minzoom: mapStyleConfig.asset.zoom,
    type: 'line',
    source: MapLayersSources.INTERVENTION_CREATION_HALO,
    filter: ['==', [geometryType], 'LineString'],
    paint: {
      'line-width': 8,
      'line-color': mapStyleConfig.colors.pink,
      'line-opacity': mapStyleConfig.intervention.halo.opacity,
      'line-blur': 4
    }
  },
  {
    id: InterventionCreationLayer.polygonHalo,
    minzoom: mapStyleConfig.intervention.zoomCreation,
    type: 'line',
    source: MapLayersSources.INTERVENTION_CREATION_AREAS,
    layout: mapStyleConfig.layouts['line-rounded'],
    filter: ['==', [geometryType], 'Polygon'],
    paint: {
      'line-width': 2,
      'line-color': mapStyleConfig.intervention.color,
      'line-opacity': mapStyleConfig.intervention.halo.opacity
    }
  }
];

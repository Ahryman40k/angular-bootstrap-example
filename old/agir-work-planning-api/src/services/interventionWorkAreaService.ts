import { Feature, MultiPolygon, Polygon } from '@turf/helpers';
import * as turf from '@turf/turf';
import { IFeature } from '@villemontreal/agir-work-planning-lib/dist/src';

import { spatialAnalysisService } from './spatialAnalysisService';
import { workAreaService } from './workAreaService';

const BUFFER_INTERVENTION_AREA_IMPORT_METERS = 5;

export class InterventionWorkAreaService {
  /**
   * Generates a work area for an imported intervention.
   * Creates a buffer around the source geometry.
   * @param geometry The geometry to generate the work area from.
   */
  public generateImportWorkArea(features: IFeature[]): Feature<Polygon | MultiPolygon> {
    const polygons: turf.Feature<turf.Polygon>[] = [];
    for (const feature of features) {
      const bufferedFeature = turf.buffer(feature, BUFFER_INTERVENTION_AREA_IMPORT_METERS, { units: 'meters' });
      if (bufferedFeature.geometry.type === 'MultiPolygon') {
        polygons.push(
          ...spatialAnalysisService.multiPolygonToPolygons(bufferedFeature as turf.Feature<turf.MultiPolygon>)
        );
      } else {
        polygons.push(bufferedFeature as turf.Feature<turf.Polygon>);
      }
    }
    const workArea = workAreaService.simplifyWorkArea(turf.union(...polygons));
    // If multi polygon, we link them.
    return workAreaService.linkMultiPolygon(workArea);
  }
}

export const interventionWorkAreaService = new InterventionWorkAreaService();

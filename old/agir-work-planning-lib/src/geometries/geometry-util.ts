import * as turf from '@turf/turf';
import { IPlainIntervention, IPlainProject } from '../planning';

export abstract class GeometryUtil {
  /**
   * Validates that parent Feature geometry contains all children
   * a list of id of those not conatained returned.
   * An empty list means everything is contained or empty children
   * Features must id to be identified when not contained
   * @param parent
   * @param children
   */
  public static validateProjectContainsIntervention(
    project: IPlainProject,
    interventions: IPlainIntervention[]
  ): string[] {
    const notContainedChildren = interventions.filter(x => {
      try {
        return !!turf.difference(x.interventionArea.geometry as turf.Polygon, project.geometry as turf.Polygon);
      } catch (e) {
        return !!turf.difference(turf.polygon(x.interventionArea.geometry as any), project.geometry as turf.Polygon);
      }
    });
    return notContainedChildren.map(x => x.id);
  }
}

declare module '@turf/boolean-crosses' {
  import { Feature, Geometry } from '@turf/turf';

  /**
   * Boolean-Crosses returns True if the intersection results in a geometry whose dimension is one less than the maximum
   * dimension of the two source geometries and the intersection set is interior to both source geometries.
   *
   * @name booleanCrosses
   * @param {Geometry|Feature} feature1 GeoJSON Feature or Geometry
   * @param {Geometry|Feature} feature2 GeoJSON Feature or Geometry
   * @returns {boolean} true/false
   * @example
   * var line1 = turf.lineString([[-2, 2], [4, 2]]);
   * var line2 = turf.lineString([[1, 1], [1, 2], [1, 3], [1, 4]]);
   *
   * var cross = turf.booleanCrosses(line1, line2);
   * //=true
   */
  export default function booleanCrosses(feature1: Geometry | Feature, feature2: Geometry | Feature): boolean;
}

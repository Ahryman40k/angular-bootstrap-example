import { FeatureCollection, Point } from '@turf/turf';
import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ICountByBoroughProperties } from './count-by-borough-properties';

export interface ICountByBoroughFeaturesArgs {
  interventionCounts: ICountBy[];
  projectCounts: ICountBy[];
  featureCollection: FeatureCollection<Point, ICountByBoroughProperties>;
}

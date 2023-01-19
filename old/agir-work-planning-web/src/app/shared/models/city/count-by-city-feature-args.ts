import { FeatureCollection, Point } from '@turf/turf';
import { ICountBy } from '@villemontreal/agir-work-planning-lib/dist/src';

import { ICountByCityProperties } from './count-by-city-properties';

export interface ICountByCityFeaturesArgs {
  rtuProjectCounts: ICountBy[];
  featureCollection: FeatureCollection<Point, ICountByCityProperties>;
}

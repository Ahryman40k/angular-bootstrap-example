import { Feature, Point } from '@turf/turf';

import { ICountByCityProperties } from './count-by-city-properties';

export type CityCountFeature = Feature<Point, ICountByCityProperties>;

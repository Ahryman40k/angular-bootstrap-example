import { Feature, Point } from '@turf/turf';

import { ICountByBoroughProperties } from './count-by-borough-properties';

export type BoroughCountFeature = Feature<Point, ICountByBoroughProperties>;

import { FeatureCollection, Point } from '@turf/turf';
import { cloneDeep } from 'lodash';

import { ICountByBoroughProperties } from '../models/borough/count-by-borough-properties';
import { ICountByCityProperties } from '../models/city/count-by-city-properties';

class BoroughFeatures {
  public getCentroids(
    rawCentroids: FeatureCollection<Point, ICountByBoroughProperties>
  ): FeatureCollection<Point, any> {
    for (let i = 0; i < rawCentroids.features.length; i++) {
      const feature = rawCentroids.features[i];
      feature.id = i + 1;
    }
    return rawCentroids;
  }

  public getBoroughCentroids(boroughIds: string[]): FeatureCollection<Point, ICountByBoroughProperties> {
    const rawCentroids = cloneDeep(require('./centroids.json')) as FeatureCollection<Point, any>;
    const centroids = this.getCentroids(rawCentroids);
    centroids.features = centroids.features.filter(f => boroughIds.includes(f.properties.ABREV));
    centroids.features.forEach(f => (f.properties.id = 'count-by-borough-' + f.properties.ABREV));
    return centroids as FeatureCollection<Point, ICountByBoroughProperties>;
  }

  public getCityCentroids(cityIds: string[]): FeatureCollection<Point, ICountByCityProperties> {
    const rawCentroids = cloneDeep(require('../cities/centroids.json')) as FeatureCollection<Point, any>;
    const centroids = this.getCentroids(rawCentroids);
    centroids.features = centroids.features.filter(f => cityIds.includes(f.properties.ABREV));
    centroids.features.forEach(f => (f.properties.id = 'count-by-city-' + f.properties.ABREV));
    return centroids as FeatureCollection<Point, ICountByCityProperties>;
  }
}
export const boroughFeatures = new BoroughFeatures();

import { Feature, FeatureCollection, Geometry } from '@turf/turf';

export interface IGeoJsonSource {
  _data: FeatureCollection<Geometry, any>;
  setData(data: Feature<Geometry> | FeatureCollection<Geometry>): this;
}

declare module 'geojson-path-finder' {
  import { Feature, FeatureCollection, LineString, Point, Position } from '@turf/turf';

  declare class PathFinder {
    constructor(network: FeatureCollection<LineString>, options?: FindPathOptions);
    public findPath(start: Feature<Point>, finish: Feature<Point>, options?: FindPathOptions): FindPathResult;
  }

  declare interface FindPathResult {
    public path: Position[];
    public weight: number;
  }

  declare interface FindPathOptions {
    precision?: number;
  }

  export = PathFinder;
}

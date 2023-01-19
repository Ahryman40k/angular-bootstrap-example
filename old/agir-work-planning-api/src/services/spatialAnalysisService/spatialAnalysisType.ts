import { RoadNetworkType } from '@villemontreal/agir-work-planning-lib/dist/src';
import { Feature, Geometry } from 'geojson';

export declare type IRoadNetwork =
  | RoadNetworkType.arterial
  | RoadNetworkType.arterialLocal
  | RoadNetworkType.local
  | RoadNetworkType.offRoadNetwork;

export declare type RoadSections = Feature<
  Geometry,
  {
    [name: string]: any;
  }
>[];

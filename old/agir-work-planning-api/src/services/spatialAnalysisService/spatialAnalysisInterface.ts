import { Units as turfUnits } from '@turf/turf';
import { IFeatureCollection, IPaging } from '@villemontreal/agir-work-planning-lib/dist/src';

export interface IPaginatedResults<T> {
  paging: IPaging;
  items: T[];
}

export interface IIntersectedFeaturesOptions {
  bufferDistance?: number;
  minIntersectionArea?: number;
}

export interface IBufferOptions {
  units?: turfUnits;
  steps?: number;
}

export interface IRoadSection {
  id: number;
  name: string;
  shortName: string;
  fromName: string;
  fromShortName: string;
  toName: string;
  toShortName: string;
  scanDirection: number;
  classification: number;
  cityName: string;
  cityNameLeft: string;
  cityNameRight: string;
  cityId: string;
  cityIdLeft: string;
  cityIdRight: string;
  borough: string;
  boroughLeft: string;
  boroughRight: string;
  boroughId: number;
  boroughIdLeft: number;
  boroughIdRight: number;
  lineGeometry: any;
  surfaceGeometry: any;
  length: number;
  area: number;
}

export interface IStreetSpatialAnalysis {
  name?: string;
  shortName?: string;
  fromName?: string;
  fromShortName?: string;
  toName?: string;
  toShortName?: string;
  /**
   * area in meters
   */
  area?: number;
  /**
   * length in meters
   */
  length?: number;
  /**
   * length in meters that intersect with the work area
   */
  lengthWithWorkArea?: number;
  isArterial?: boolean;
  roadSectionIds?: string[];
  /**
   * a geojson polygon
   */
  polygonGeometry?: {};
  /**
   * a geojson linestring
   */
  lineGeometry?: {};
}

export interface ISpatialAnalysisStreetResponse {
  roadSections?: IFeatureCollection;
  roadNetworkTypeId?: string;
  streetName?: string;
  streetFrom?: string;
  streetTo?: string;
}

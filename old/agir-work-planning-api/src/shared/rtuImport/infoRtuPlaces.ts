import { AllGeoJSON } from '@turf/turf';
export interface IInfoRtuPlaces {
  text?: string;
  type?: string;
  sections?: {
    geometries?: string[];
  };
  intersection?: {
    geometry: string;
  };
  interval?: {
    geometries?: string[];
  };
  polygon?: {
    geometries?: string[];
  };
  address?: {
    section: {
      geometry?: string;
    };
  };
  geoJsonGeometry?: AllGeoJSON;
}

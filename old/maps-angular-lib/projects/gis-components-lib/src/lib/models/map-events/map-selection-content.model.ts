import { MapboxGeoJSONFeature } from 'mapbox-gl';
export interface IMapSelectionContent {
  logicLayerId: string;
  features: MapboxGeoJSONFeature[];
}
